"""
Push notification service for mobile app notifications.
Implements basic push notification infrastructure.
"""
from typing import Optional, Dict, Any
import logging
import httpx
from app.config import settings

logger = logging.getLogger(__name__)


class PushNotificationService:
    """
    Service for sending push notifications to mobile devices.
    Can be extended to use Expo Push Notifications, FCM, or APNS.
    """
    
    def __init__(self):
        """Initialize the push notification service."""
        self.expo_endpoint = "https://exp.host/--/api/v2/push/send"
    
    async def send_notification(
        self,
        push_token: str,
        title: str,
        body: str,
        data: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Send a push notification to a device.
        
        Args:
            push_token: Expo push token
            title: Notification title
            body: Notification body
            data: Additional data to send with notification
            
        Returns:
            True if notification sent successfully
        """
        if not push_token or not push_token.startswith("ExponentPushToken"):
            logger.warning(f"Invalid push token: {push_token}")
            return False
        
        try:
            message = {
                "to": push_token,
                "title": title,
                "body": body,
                "sound": "default",
                "priority": "high"
            }
            
            if data:
                message["data"] = data
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.expo_endpoint,
                    json=message,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    result = response.json()
                    if result.get("data", {}).get("status") == "ok":
                        logger.info(f"Push notification sent successfully to {push_token[:20]}...")
                        return True
                    else:
                        logger.error(f"Push notification failed: {result}")
                        return False
                else:
                    logger.error(f"Push notification request failed: {response.status_code}")
                    return False
                    
        except Exception as e:
            logger.error(f"Error sending push notification: {e}")
            return False
    
    async def send_order_update_notification(
        self,
        push_token: str,
        order_id: str,
        shop_name: str,
        status: str
    ) -> bool:
        """
        Send order status update push notification.
        
        Args:
            push_token: User's push token
            order_id: Order ID
            shop_name: Shop name
            status: New order status
            
        Returns:
            True if notification sent successfully
        """
        status_titles = {
            "accepted": "Order Accepted",
            "preparing": "Order Being Prepared",
            "ready": "Order Ready for Pickup!",
            "completed": "Order Completed",
            "cancelled": "Order Cancelled"
        }
        
        status_bodies = {
            "accepted": f"Your order at {shop_name} has been accepted.",
            "preparing": f"Your order at {shop_name} is being prepared.",
            "ready": f"Your order at {shop_name} is ready for pickup!",
            "completed": f"Thank you for ordering from {shop_name}!",
            "cancelled": f"Your order at {shop_name} has been cancelled."
        }
        
        title = status_titles.get(status, "Order Update")
        body = status_bodies.get(status, f"Order {order_id} status: {status}")
        
        return await self.send_notification(
            push_token,
            title,
            body,
            data={"order_id": order_id, "shop_name": shop_name, "status": status}
        )
    
    async def send_loyalty_reward_notification(
        self,
        push_token: str,
        shop_name: str,
        points_earned: int
    ) -> bool:
        """
        Send loyalty points earned notification.
        
        Args:
            push_token: User's push token
            shop_name: Shop name
            points_earned: Points earned
            
        Returns:
            True if notification sent successfully
        """
        title = "Points Earned!"
        body = f"You earned {points_earned} points at {shop_name}"
        
        return await self.send_notification(
            push_token,
            title,
            body,
            data={"shop_name": shop_name, "points_earned": points_earned}
        )


# Global push notification service instance
push_notification_service = PushNotificationService()
