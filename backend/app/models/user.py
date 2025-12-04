from models.authProvider import AuthProvider


class User(AuthProvider):
    def __init__(self, username, database):
        self.username = username
        self.database = database

    def callback(self):
        pass

    def addAuthProvider(token):
        pass
