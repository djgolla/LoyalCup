"""
Supabase database client initialization and helper functions.
Provides both service role and anon key clients for different operations.
"""
from typing import Optional, Dict, Any, List
from supabase import create_client, Client
from app.config import settings


class SupabaseClient:
    """
    Manages Supabase client connections and provides helper methods.
    
    Attributes:
        service_client: Supabase client with service role key (for backend operations)
        anon_client: Supabase client with anon key (for user-level operations)
    """
    
    def __init__(self):
        """Initialize Supabase clients with service role and anon keys."""
        try:
            self.service_client: Client = create_client(
                settings.supabase_url,
                settings.supabase_service_role_key
            )
            self.anon_client: Client = create_client(
                settings.supabase_url,
                settings.supabase_anon_key
            )
        except Exception as e:
            print(f"❌ SUPABASE CONNECTION ERROR: {e}")
            print(f"URL: {settings.supabase_url}")
            print(f"Service Key Length: {len(settings.supabase_service_role_key)}")
            print(f"Service Key Preview: {settings.supabase_service_role_key[:30]}...")
            raise
    
    def get_service_client(self) -> Client:
        """
        Get the Supabase client with service role key.
        Use this for backend operations that require elevated privileges.
        
        Returns:
            Supabase client with service role key
        """
        return self.service_client
    
    def get_anon_client(self) -> Client:
        """
        Get the Supabase client with anon key.
        Use this for user-level operations.
        
        Returns:
            Supabase client with anon key
        """
        return self.anon_client
    
    async def execute_query(
        self,
        table: str,
        operation: str,
        data: Optional[Dict[str, Any]] = None,
        filters: Optional[Dict[str, Any]] = None,
        use_service_role: bool = True
    ) -> Any:
        """
        Execute a database query with error handling.
        
        Args:
            table: Table name to query
            operation: Operation type ('select', 'insert', 'update', 'delete')
            data: Data to insert or update
            filters: Filters to apply to the query
            use_service_role: Whether to use service role key (default: True)
            
        Returns:
            Query result
            
        Raises:
            Exception: If query execution fails
        """
        client = self.service_client if use_service_role else self.anon_client
        
        try:
            query = client.table(table)
            
            if operation == 'select':
                if filters:
                    for key, value in filters.items():
                        query = query.eq(key, value)
                response = query.execute()
                
            elif operation == 'insert':
                response = query.insert(data).execute()
                
            elif operation == 'update':
                if filters:
                    for key, value in filters.items():
                        query = query.eq(key, value)
                response = query.update(data).execute()
                
            elif operation == 'delete':
                if filters:
                    for key, value in filters.items():
                        query = query.eq(key, value)
                response = query.delete().execute()
                
            else:
                raise ValueError(f"Unsupported operation: {operation}")
            
            return response.data
            
        except Exception as e:
            raise Exception(f"Database query failed: {str(e)}")
    
    async def get_by_id(
        self,
        table: str,
        id_value: str,
        id_column: str = "id",
        use_service_role: bool = True
    ) -> Optional[Dict[str, Any]]:
        """
        Get a single record by ID.
        
        Args:
            table: Table name
            id_value: ID value to search for
            id_column: ID column name (default: 'id')
            use_service_role: Whether to use service role key
            
        Returns:
            Record data or None if not found
        """
        result = await self.execute_query(
            table=table,
            operation='select',
            filters={id_column: id_value},
            use_service_role=use_service_role
        )
        return result[0] if result else None
    
    async def get_all(
        self,
        table: str,
        filters: Optional[Dict[str, Any]] = None,
        use_service_role: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Get all records from a table, optionally filtered.
        
        Args:
            table: Table name
            filters: Optional filters to apply
            use_service_role: Whether to use service role key
            
        Returns:
            List of records
        """
        result = await self.execute_query(
            table=table,
            operation='select',
            filters=filters,
            use_service_role=use_service_role
        )
        return result or []


# Global Supabase client instance - LAZY LOADED
_supabase_client: Optional[SupabaseClient] = None


def get_supabase() -> SupabaseClient:
    """
    Dependency function to get the Supabase client.
    Use this in FastAPI route dependencies.
    Lazy loads the client on first use.
    
    Returns:
        Global SupabaseClient instance
    """
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = SupabaseClient()
    return _supabase_client