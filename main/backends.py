from django.contrib.auth import get_user_model


class BackendBase:
    """Base Backend para la autentificación de usuarios"""

    def __init__(self):
        self._user_model = get_user_model()
        self.user_model = self._user_model
    
    def authenticate(self, *args, **kwargs):
        password = kwargs.pop('password', None)

        try:
            user = self.user_model.objects.get(**kwargs)
            if user.check_password(password):
                return user
        except (self.user_model.DoesNotExist, self.user_model.MultipleObjectsReturned):
            self.user_model().set_password(password)
    
    def get_user(self, *args, **kwargs):
        try:
            if kwargs:
                return self.user_model.objects.get(**kwargs)
            return self.user_model.objects.get(id=args.pop())
        except (self.user_model.DoesNotExist, self.user_model.MultipleObjectsReturned):
            return None


class EmailAuthenticationBackend(BackendBase):
    """Backend de autetificación de usuarios por email"""

    def authenticate(self, email=None, password=None):
        return super().authenticate(email=email, password=password)
