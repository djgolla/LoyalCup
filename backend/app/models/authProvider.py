from abc import ABC, abstractmethod


# auth provider interface
class AuthProvider(ABC):
    @abstractmethod
    def callback(self, code):
        pass
