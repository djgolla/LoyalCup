@router.patch("/shops/{shop_id}/approve")
async def approve_shop(shop_id: str, admin: dict = Depends(require_admin)):
    """Approve a pending shop and generate API key"""
    try:
        db = get_supabase()
        
        # Update shop status
        await db.execute_query(
            table="shops",
            operation="update",
            data={"status": "active"},
            filters={"id": shop_id}
        )
        
        # Generate API key
        api_key = f"lc_shop_{secrets.token_urlsafe(32)}"
        await db.execute_query(
            table="shop_api_keys",
            operation="insert",
            data={
                "shop_id": shop_id,
                "api_key": api_key
            }
        )
        
        # TODO: Send email to shop owner with credentials
        
        return {
            "success": True,
            "message": "Shop approved and API key generated"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))