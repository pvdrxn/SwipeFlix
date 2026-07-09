from django.contrib.auth import authenticate, get_user_model
from django.core.mail import send_mail
from django.conf import settings
User = get_user_model()
from rest_framework import viewsets, generics, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .models import PickedMovie, EmailVerificationCode
from .serializers import RegisterSerializer, PickedMovieSerializer

class PickedMovieViewSet(viewsets.ModelViewSet):
    serializer_class = PickedMovieSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PickedMovie.objects.filter(user=self.request.user)

    def perform_destroy(self, instance):
        if instance.is_saved or instance.watched or instance.is_favorite:
            instance.choice = None
            instance.save(update_fields=["choice"])
        else:
            instance.delete()

    def perform_create(self, serializer):
        tmdb_id = serializer.validated_data.get("tmdb_id")
        defaults = {
            "title": serializer.validated_data.get("title"),
            "poster_path": serializer.validated_data.get("poster_path"),
            "rating": serializer.validated_data.get("rating"),
        }
        if "choice" in serializer.validated_data:
            defaults["choice"] = serializer.validated_data["choice"]
        if "is_saved" in serializer.validated_data:
            defaults["is_saved"] = serializer.validated_data["is_saved"]
        if "is_favorite" in serializer.validated_data:
            defaults["is_favorite"] = serializer.validated_data["is_favorite"]
        obj, _ = PickedMovie.objects.update_or_create(
            user=self.request.user,
            tmdb_id=tmdb_id,
            defaults=defaults,
        )
        serializer.instance = obj

    def list(self, request):
        choice = request.query_params.get("choice")
        is_saved = request.query_params.get("is_saved")
        queryset = self.get_queryset()
        if is_saved and is_saved.lower() == "true":
            queryset = queryset.filter(is_saved=True)
        elif choice == "saved":
            queryset = queryset.filter(is_saved=True)
        elif choice:
            queryset = queryset.filter(choice=choice)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def saved(self, request):
        queryset = self.get_queryset().filter(is_saved=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def toggle_save(self, request):
        tmdb_id = request.data.get("tmdb_id")
        try:
            pick = PickedMovie.objects.get(user=request.user, tmdb_id=tmdb_id)
            pick.is_saved = not pick.is_saved
            pick.save(update_fields=["is_saved"])
            serializer = self.get_serializer(pick)
            return Response(serializer.data)
        except PickedMovie.DoesNotExist:
            serializer = self.get_serializer(data={
                "tmdb_id": tmdb_id,
                "title": request.data.get("title"),
                "poster_path": request.data.get("poster_path"),
                "rating": request.data.get("rating"),
                "choice": "saved",
                "is_saved": True,
            })
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            return Response(serializer.data, status=201)

    @action(detail=False, methods=['get'])
    def favorites(self, request):
        queryset = self.get_queryset().filter(is_favorite=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def toggle_favorite(self, request):
        tmdb_id = request.data.get("tmdb_id")
        try:
            pick = PickedMovie.objects.get(user=request.user, tmdb_id=tmdb_id)
            pick.is_favorite = not pick.is_favorite
            pick.save(update_fields=["is_favorite"])
            serializer = self.get_serializer(pick)
            return Response(serializer.data)
        except PickedMovie.DoesNotExist:
            serializer = self.get_serializer(data={
                "tmdb_id": tmdb_id,
                "title": request.data.get("title"),
                "poster_path": request.data.get("poster_path"),
                "rating": request.data.get("rating"),
                "is_favorite": True,
            })
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            return Response(serializer.data, status=201)

    @action(detail=False, methods=['get'])
    def watched(self, request):
        queryset = self.get_queryset().filter(watched=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def toggle_watched(self, request, pk=None):
        movie = self.get_object()
        movie.watched = not movie.watched
        movie.save()
        serializer = self.get_serializer(movie)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def clear_liked(self, request):
        deleted, _ = self.get_queryset().filter(choice="liked").delete()
        return Response({"deleted": deleted})

    @action(detail=False, methods=['post'])
    def clear_disliked(self, request):
        deleted, _ = self.get_queryset().filter(choice="pass").delete()
        return Response({"deleted": deleted})

    @action(detail=False, methods=['post'])
    def clear_saved(self, request):
        deleted, _ = self.get_queryset().filter(is_saved=True).delete()
        return Response({"deleted": deleted})

    @action(detail=False, methods=['post'])
    def clear_favorites(self, request):
        deleted, _ = self.get_queryset().filter(is_favorite=True).delete()
        return Response({"deleted": deleted})

    @action(detail=False, methods=['post'])
    def clear_all(self, request):
        deleted, _ = self.get_queryset().delete()
        return Response({"deleted": deleted})


class LoginView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get("username", "")
        password = request.data.get("password", "")
        user = authenticate(username=username, password=password)
        if user is not None:
            refresh = RefreshToken.for_user(user)
            return Response({
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            })

        try:
            inactive = User.objects.get(username=username, is_active=False)
            return Response(
                {
                    "detail": "Email not verified.",
                    "email": inactive.email,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        except User.DoesNotExist:
            return Response(
                {"detail": "Invalid username or password."},
                status=status.HTTP_400_BAD_REQUEST,
            )


class RegisterView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        email = request.data.get("email", "")
        existing = User.objects.filter(email=email).first()
        if existing and existing.is_active:
            return Response(
                {"detail": "An account with this email already exists."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if existing and not existing.is_active:
            existing.delete()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        user.is_active = False
        user.save(update_fields=["is_active"])

        code = EmailVerificationCode.generate_for_user(user)
        send_mail(
            subject="Verify your Movie Picker account",
            message=f"Your verification code is: {code.code}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )

        return Response(
            {"detail": "Verification code sent to your email."},
            status=status.HTTP_201_CREATED,
        )


class MeView(generics.GenericAPIView):
    def get(self, request):
        user = request.user
        saved_count = PickedMovie.objects.filter(user=user, is_saved=True).count()
        pass_count = PickedMovie.objects.filter(user=user, choice="pass").count()
        favorite_count = PickedMovie.objects.filter(user=user, is_favorite=True).count()
        return Response(
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "saved_count": saved_count,
                "pass_count": pass_count,
                "favorite_count": favorite_count,
            }
        )


class VerifyEmailView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get("email", "")
        code = request.data.get("code", "")

        try:
            user = User.objects.get(email=email, is_active=False)
        except User.DoesNotExist:
            return Response(
                {"detail": "No account found with that email."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            verification = EmailVerificationCode.objects.get(
                user=user, code=code, purpose="email_verify", is_used=False
            )
        except EmailVerificationCode.DoesNotExist:
            return Response(
                {"detail": "Invalid or expired code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        verification.is_used = True
        verification.save(update_fields=["is_used"])
        user.is_active = True
        user.save(update_fields=["is_active"])

        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        })


class ResendCodeView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get("email", "")

        try:
            user = User.objects.get(email=email, is_active=False)
        except User.DoesNotExist:
            return Response(
                {"detail": "No inactive account found with that email."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        code = EmailVerificationCode.generate_for_user(user)
        send_mail(
            subject="Your new Movie Picker verification code",
            message=f"Your new verification code is: {code.code}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )

        return Response({"detail": "New code sent to your email."})


class SendPasswordCodeView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        EmailVerificationCode.objects.filter(
            user=user, purpose="password_change", is_used=False
        ).update(is_used=True)

        code = EmailVerificationCode.generate_for_user(user, purpose="password_change")
        send_mail(
            subject="Your Movie Picker password change code",
            message=f"Your password change code is: {code.code}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )

        return Response({"detail": "Code sent to your email."})


class ChangePasswordView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        code = request.data.get("code", "")
        new_password = request.data.get("new_password", "")

        if len(new_password) < 8:
            return Response(
                {"detail": "Password must be at least 8 characters."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            verification = EmailVerificationCode.objects.get(
                user=user, code=code, purpose="password_change", is_used=False
            )
        except EmailVerificationCode.DoesNotExist:
            return Response(
                {"detail": "Invalid or expired code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        verification.is_used = True
        verification.save(update_fields=["is_used"])
        user.set_password(new_password)
        user.save(update_fields=["password"])

        return Response({"detail": "Password changed successfully."})


class SendEmailCodeView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        new_email = request.data.get("new_email", "")

        if not new_email:
            return Response(
                {"detail": "New email is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        existing = User.objects.filter(email=new_email).exclude(id=user.id).first()
        if existing:
            return Response(
                {"detail": "This email is already in use."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        EmailVerificationCode.objects.filter(
            user=user, purpose="email_change", is_used=False
        ).update(is_used=True)

        code = EmailVerificationCode.generate_for_user(user, purpose="email_change")
        send_mail(
            subject="Your Movie Picker email change code",
            message=f"Your email change code is: {code.code}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[new_email],
            fail_silently=False,
        )

        return Response({"detail": "Code sent to your new email."})


class ChangeEmailView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        code = request.data.get("code", "")
        new_email = request.data.get("new_email", "")

        if not new_email or not code:
            return Response(
                {"detail": "New email and code are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        existing = User.objects.filter(email=new_email).exclude(id=user.id).first()
        if existing:
            return Response(
                {"detail": "This email is already in use."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            verification = EmailVerificationCode.objects.get(
                user=user, code=code, purpose="email_change", is_used=False
            )
        except EmailVerificationCode.DoesNotExist:
            return Response(
                {"detail": "Invalid or expired code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        verification.is_used = True
        verification.save(update_fields=["is_used"])
        user.email = new_email
        user.save(update_fields=["email"])

        return Response({"detail": "Email changed successfully."})


class DeleteAccountView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        password = request.data.get("password", "")
        auth_user = authenticate(username=user.username, password=password)
        if auth_user is None:
            return Response(
                {"detail": "Incorrect password."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
