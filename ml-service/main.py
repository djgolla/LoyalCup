# ml-service/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import joblib
import numpy as np
from datetime import datetime, timedelta
import asyncpg
import os
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error
import json

app = FastAPI(title="LoyalCup ML Service", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL")

# Global model cache
MODEL_CACHE = {}

# ==================== MODELS ====================

class OrderItem(BaseModel):
    name: str
    quantity: int
    category: Optional[str] = None

class PredictionRequest(BaseModel):
    shop_id: str
    items: List[OrderItem]
    current_queue_length: int = 0
    staff_count: int = 2

class PredictionResponse(BaseModel):
    estimated_seconds: int
    estimated_minutes: int
    estimated_ready_time: str
    confidence_score: float
    breakdown: dict

class TrainingRequest(BaseModel):
    shop_id: str
    force_retrain: bool = False

# ==================== HELPER FUNCTIONS ====================

async def get_db_connection():
    return await asyncpg.connect(DATABASE_URL)

def get_hour_features(hour: int):
    """Convert hour to rush hour indicators"""
    is_morning_rush = 1 if 7 <= hour <= 9 else 0
    is_lunch_rush = 1 if 11 <= hour <= 13 else 0
    is_afternoon_rush = 1 if 15 <= hour <= 17 else 0
    is_rush_hour = 1 if is_morning_rush or is_lunch_rush or is_afternoon_rush else 0
    return is_morning_rush, is_lunch_rush, is_afternoon_rush, is_rush_hour

async def get_item_complexity(shop_id: str, item_name: str, conn):
    """Get complexity score for an item"""
    result = await conn.fetchrow(
        """
        SELECT complexity_score, base_prep_time_seconds
        FROM item_complexity
        WHERE shop_id = $1 AND LOWER(item_name) = LOWER($2)
        LIMIT 1
        """,
        shop_id, item_name
    )
    
    if result:
        return result['complexity_score'], result['base_prep_time_seconds']
    
    # Default if not found
    return 1.0, 60

def calculate_features(items: List[OrderItem], queue_length: int, staff_count: int, shop_id: str, conn) -> dict:
    """Calculate feature vector for prediction"""
    now = datetime.now()
    hour = now.hour
    day_of_week = now.weekday()
    
    # Get hour features
    is_morning_rush, is_lunch_rush, is_afternoon_rush, is_rush_hour = get_hour_features(hour)
    
    # Calculate item features
    total_items = sum(item.quantity for item in items)
    
    # Get complexity scores (simplified for now - in production, query DB)
    complexity_map = {
        'espresso': 1.5,
        'coffee': 0.8,
        'cold_brew': 1.0,
        'blended': 2.5,
        'pastry': 0.3,
        'food': 2.0
    }
    
    total_complexity = 0
    category_counts = {}
    
    for item in items:
        category = item.category or 'coffee'
        complexity = complexity_map.get(category, 1.0)
        total_complexity += complexity * item.quantity
        category_counts[category] = category_counts.get(category, 0) + item.quantity
    
    avg_complexity = total_complexity / total_items if total_items > 0 else 1.0
    
    # Calculate items per staff
    items_per_staff = total_items / max(staff_count, 1)
    
    features = {
        'total_items': total_items,
        'avg_complexity': avg_complexity,
        'total_complexity': total_complexity,
        'queue_length': queue_length,
        'staff_count': staff_count,
        'items_per_staff': items_per_staff,
        'hour_of_day': hour,
        'day_of_week': day_of_week,
        'is_morning_rush': is_morning_rush,
        'is_lunch_rush': is_lunch_rush,
        'is_afternoon_rush': is_afternoon_rush,
        'is_rush_hour': is_rush_hour,
        'has_espresso': 1 if 'espresso' in category_counts else 0,
        'has_blended': 1 if 'blended' in category_counts else 0,
        'espresso_count': category_counts.get('espresso', 0),
        'blended_count': category_counts.get('blended', 0),
    }
    
    return features

def features_to_array(features: dict) -> np.ndarray:
    """Convert feature dict to numpy array for model"""
    feature_order = [
        'total_items', 'avg_complexity', 'total_complexity',
        'queue_length', 'staff_count', 'items_per_staff',
        'hour_of_day', 'day_of_week',
        'is_morning_rush', 'is_lunch_rush', 'is_afternoon_rush', 'is_rush_hour',
        'has_espresso', 'has_blended', 'espresso_count', 'blended_count'
    ]
    
    return np.array([[features.get(f, 0) for f in feature_order]])

# ==================== RULE-BASED FALLBACK ====================

def rule_based_prediction(features: dict) -> dict:
    """Simple rule-based prediction as fallback"""
    base_time = 60  # 1 minute base
    
    # Time per item
    time_per_item = 45  # 45 seconds per item
    
    # Complexity multiplier
    complexity_multiplier = features['avg_complexity']
    
    # Queue penalty
    queue_penalty = features['queue_length'] * 30  # 30 seconds per order ahead
    
    # Staff bonus
    staff_bonus = max(0, (features['staff_count'] - 1) * 15)  # 15 seconds saved per extra staff
    
    # Rush hour penalty
    rush_penalty = 60 if features['is_rush_hour'] else 0
    
    # Calculate
    estimated_seconds = int(
        base_time +
        (features['total_items'] * time_per_item * complexity_multiplier) +
        queue_penalty +
        rush_penalty -
        staff_bonus
    )
    
    # Minimum 2 minutes, maximum 30 minutes
    estimated_seconds = max(120, min(estimated_seconds, 1800))
    
    breakdown = {
        'base_time': base_time,
        'item_time': features['total_items'] * time_per_item * complexity_multiplier,
        'queue_penalty': queue_penalty,
        'rush_penalty': rush_penalty,
        'staff_bonus': staff_bonus,
    }
    
    return {
        'estimated_seconds': estimated_seconds,
        'breakdown': breakdown,
        'method': 'rule_based'
    }

# ==================== ML MODEL ====================

async def load_or_train_model(shop_id: str, force_retrain: bool = False):
    """Load existing model or train new one"""
    
    # Check cache
    if shop_id in MODEL_CACHE and not force_retrain:
        return MODEL_CACHE[shop_id]
    
    # Try to load from disk
    model_path = f"models/shop_{shop_id}_model.joblib"
    
    if os.path.exists(model_path) and not force_retrain:
        model = joblib.load(model_path)
        MODEL_CACHE[shop_id] = model
        return model
    
    # Train new model
    conn = await get_db_connection()
    
    try:
        # Fetch training data
        rows = await conn.fetch(
            """
            SELECT 
                total_items,
                total_complexity_score,
                hour_of_day,
                day_of_week,
                is_rush_hour,
                queue_length,
                staff_count,
                total_duration
            FROM order_timing_data
            WHERE shop_id = $1
              AND total_duration IS NOT NULL
              AND total_duration > 0
              AND time_placed > NOW() - INTERVAL '90 days'
            ORDER BY time_placed DESC
            LIMIT 1000
            """,
            shop_id
        )
        
        if len(rows) < 50:
            # Not enough data, return None to use rule-based
            return None
        
        # Prepare training data
        X = []
        y = []
        
        for row in rows:
            features = {
                'total_items': row['total_items'],
                'avg_complexity': row['total_complexity_score'] or 1.0,
                'total_complexity': row['total_complexity_score'] * row['total_items'] or row['total_items'],
                'queue_length': row['queue_length'] or 0,
                'staff_count': row['staff_count'] or 2,
                'items_per_staff': row['total_items'] / max(row['staff_count'] or 2, 1),
                'hour_of_day': row['hour_of_day'],
                'day_of_week': row['day_of_week'],
                'is_morning_rush': 1 if 7 <= row['hour_of_day'] <= 9 else 0,
                'is_lunch_rush': 1 if 11 <= row['hour_of_day'] <= 13 else 0,
                'is_afternoon_rush': 1 if 15 <= row['hour_of_day'] <= 17 else 0,
                'is_rush_hour': 1 if row['is_rush_hour'] else 0,
                'has_espresso': 0,
                'has_blended': 0,
                'espresso_count': 0,
                'blended_count': 0,
            }
            
            X.append(features_to_array(features)[0])
            y.append(row['total_duration'])
        
        X = np.array(X)
        y = np.array(y)
        
        # Train model
        model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            min_samples_split=5,
            random_state=42
        )
        
        model.fit(X, y)
        
        # Save model
        os.makedirs("models", exist_ok=True)
        joblib.dump(model, model_path)
        
        # Cache model
        MODEL_CACHE[shop_id] = model
        
        return model
        
    finally:
        await conn.close()

# ==================== API ENDPOINTS ====================

@app.post("/api/predict-prep-time", response_model=PredictionResponse)
async def predict_prep_time(request: PredictionRequest):
    """Predict preparation time for an order"""
    
    try:
        conn = await get_db_connection()
        
        # Calculate features
        features = calculate_features(
            request.items,
            request.current_queue_length,
            request.staff_count,
            request.shop_id,
            conn
        )
        
        await conn.close()
        
        # Try to load ML model
        model = await load_or_train_model(request.shop_id)
        
        if model is not None:
            # Use ML model
            X = features_to_array(features)
            predicted_seconds = int(model.predict(X)[0])
            confidence = 0.85  # Could calculate based on training data
            method = 'ml_model'
            breakdown = {'method': 'Machine Learning Model', 'features_used': len(features)}
        else:
            # Use rule-based fallback
            result = rule_based_prediction(features)
            predicted_seconds = result['estimated_seconds']
            confidence = 0.70
            method = 'rule_based'
            breakdown = result['breakdown']
        
        # Ensure reasonable bounds
        predicted_seconds = max(120, min(predicted_seconds, 1800))
        predicted_minutes = round(predicted_seconds / 60)
        
        # Calculate ready time
        now = datetime.now()
        ready_time = now + timedelta(seconds=predicted_seconds)
        ready_time_str = ready_time.strftime("%I:%M %p")
        
        return PredictionResponse(
            estimated_seconds=predicted_seconds,
            estimated_minutes=predicted_minutes,
            estimated_ready_time=ready_time_str,
            confidence_score=confidence,
            breakdown={
                **breakdown,
                'method': method,
                'total_items': features['total_items'],
                'queue_length': features['queue_length'],
                'is_rush_hour': bool(features['is_rush_hour'])
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/record-order-timing")
async def record_order_timing(order_id: str, status: str, timestamp: str = None):
    """Record timing data when order status changes"""
    
    try:
        conn = await get_db_connection()
        
        ts = timestamp or datetime.now().isoformat()
        
        # Update timing data based on status
        if status == 'accepted':
            await conn.execute(
                "UPDATE order_timing_data SET time_accepted = $1 WHERE order_id = $2",
                ts, order_id
            )
        elif status == 'preparing':
            await conn.execute(
                "UPDATE order_timing_data SET time_preparing = $1 WHERE order_id = $2",
                ts, order_id
            )
        elif status == 'ready':
            await conn.execute(
                """
                UPDATE order_timing_data 
                SET time_ready = $1,
                    preparation_duration = EXTRACT(EPOCH FROM ($1::timestamptz - time_preparing))::INTEGER
                WHERE order_id = $2
                """,
                ts, order_id
            )
        elif status == 'completed':
            await conn.execute(
                """
                UPDATE order_timing_data 
                SET time_completed = $1,
                    total_duration = EXTRACT(EPOCH FROM ($1::timestamptz - time_placed))::INTEGER
                WHERE order_id = $2
                """,
                ts, order_id
            )
        
        await conn.close()
        
        return {"status": "success", "order_id": order_id, "recorded_status": status}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/train-model")
async def train_model(request: TrainingRequest):
    """Trigger model retraining for a shop"""
    
    try:
        model = await load_or_train_model(request.shop_id, force_retrain=request.force_retrain)
        
        if model:
            return {
                "status": "success",
                "shop_id": request.shop_id,
                "model_trained": True,
                "message": "Model trained successfully"
            }
        else:
            return {
                "status": "insufficient_data",
                "shop_id": request.shop_id,
                "model_trained": False,
                "message": "Not enough historical data to train model. Need at least 50 orders."
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/model-stats/{shop_id}")
async def get_model_stats(shop_id: str):
    """Get model performance statistics"""
    
    try:
        conn = await get_db_connection()
        
        stats = await conn.fetchrow(
            """
            SELECT 
                COUNT(*) as total_predictions,
                AVG(error_percentage) as avg_error_percentage,
                AVG(ABS(error_seconds)) as avg_error_seconds,
                STDDEV(error_seconds) as stddev_error,
                MIN(error_seconds) as min_error,
                MAX(error_seconds) as max_error
            FROM prep_time_predictions p
            JOIN order_timing_data o ON p.order_id = o.order_id
            WHERE o.shop_id = $1
              AND p.actual_seconds IS NOT NULL
              AND p.created_at > NOW() - INTERVAL '30 days'
            """,
            shop_id
        )
        
        training_data_count = await conn.fetchval(
            """
            SELECT COUNT(*)
            FROM order_timing_data
            WHERE shop_id = $1
              AND total_duration IS NOT NULL
              AND time_placed > NOW() - INTERVAL '90 days'
            """,
            shop_id
        )
        
        await conn.close()
        
        return {
            "shop_id": shop_id,
            "total_predictions": stats['total_predictions'] or 0,
            "avg_error_minutes": round((stats['avg_error_seconds'] or 0) / 60, 1),
            "avg_error_percentage": round(stats['avg_error_percentage'] or 0, 1),
            "training_data_count": training_data_count,
            "model_exists": shop_id in MODEL_CACHE or os.path.exists(f"models/shop_{shop_id}_model.joblib")
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "LoyalCup ML Service"}

# ==================== STARTUP ====================

@app.on_event("startup")
async def startup_event():
    print("🤖 LoyalCup ML Service Started")
    print("📊 Ready to predict order prep times!")
    
    # Create models directory
    os.makedirs("models", exist_ok=True)