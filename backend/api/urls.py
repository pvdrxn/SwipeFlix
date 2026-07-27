from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import PickedMovieViewSet, RegisterView, LoginView, MeView, ChangeUsernameView, DeleteAccountView

router = DefaultRouter()
router.register(r'picks', PickedMovieViewSet, basename='pick')

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/token/', LoginView.as_view(), name='auth-token'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='auth-token-refresh'),
    path('auth/me/', MeView.as_view(), name='auth-me'),
    path('auth/change-username/', ChangeUsernameView.as_view(), name='auth-change-username'),
    path('auth/delete-account/', DeleteAccountView.as_view(), name='auth-delete-account'),
    path('', include(router.urls)),
]
