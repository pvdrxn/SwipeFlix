from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import PickedMovieViewSet, RegisterView, LoginView, MeView, VerifyEmailView, ResendCodeView, SendPasswordCodeView, ChangePasswordView, SendEmailCodeView, ChangeEmailView, DeleteAccountView

router = DefaultRouter()
router.register(r'picks', PickedMovieViewSet, basename='pick')

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/token/', LoginView.as_view(), name='auth-token'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='auth-token-refresh'),
    path('auth/me/', MeView.as_view(), name='auth-me'),
    path('auth/delete-account/', DeleteAccountView.as_view(), name='auth-delete-account'),
    path('auth/verify-email/', VerifyEmailView.as_view(), name='auth-verify-email'),
    path('auth/resend-code/', ResendCodeView.as_view(), name='auth-resend-code'),
    path('auth/send-password-code/', SendPasswordCodeView.as_view(), name='auth-send-password-code'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='auth-change-password'),
    path('auth/send-email-code/', SendEmailCodeView.as_view(), name='auth-send-email-code'),
    path('auth/change-email/', ChangeEmailView.as_view(), name='auth-change-email'),
    path('', include(router.urls)),
]
