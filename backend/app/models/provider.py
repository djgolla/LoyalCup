from abc import ABC, abstractmethod
from urllib.parse import urlencode
import requests
import jwt


from models.authProvider import AuthProvider


# auth provider interface
class Provider(ABC):

    def __init__(
        self,
        clientID,
        clientSecret,
        redirectURI,
    ):
        self.clientID = clientID
        self.clientSecret = clientSecret
        self.redirectURI = redirectURI

    @abstractmethod
    def getAuthUrl(self) -> str:
        pass


class Google(Provider, AuthProvider):
    GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
    GOOGLE_SCOPES = ["openid", "email", "profile"]
    GOOGLE_RESPONSE_TYPE = "code"

    def __init__(self, clientID: str, clientSecret: str, redirectURI: str):
        super().__init__(clientID, clientSecret, redirectURI)

    def getAuthUrl(self):
        params = {
            "response_type": self.GOOGLE_RESPONSE_TYPE,
            "client_id": self.clientID,
            "redirect_uri": self.redirectURI,
            "scope": " ".join(self.GOOGLE_SCOPES),
            "access_type": "offline",
            "prompt": "select_account",
        }

        query_string = urlencode(params)
        return f"{self.GOOGLE_AUTH_URL}?{query_string}"

    def callback(self, code):
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "code": code,
            "client_id": self.clientID,
            "client_secret": self.clientSecret,
            "redirect_uri": self.redirectURI,
            "grant_type": "authorization_code",
        }

        token_response = requests.post(token_url, data=token_data).json()
        access_token = token_response.get("access_token")

        if not access_token:
            raise Exception(
                f"Failed to get access token: {token_response.get('error')}"
            )

        user_info_url = "https://www.googleapis.com/oauth2/v3/userinfo"
        headers = {"Authorization": f"Bearer {access_token}"}

        user_info_response = requests.get(user_info_url, headers=headers).json()

        google_user_id = user_info_response.get("sub")
        email = user_info_response.get("email")

        to_encode = {
            "sub": email,
            "id": google_user_id,
        }
        secret_key = "your-secret-key"

        internal_access_token = jwt.encode(to_encode, secret_key, algorithm="HS256")

        return internal_access_token


class Apple(Provider, AuthProvider):
    pass


class Facebook(Provider, AuthProvider):
    pass
