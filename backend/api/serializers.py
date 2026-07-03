from rest_framework import serializers
from django.contrib.auth.models import User
from .models import PickedMovie


class PickedMovieSerializer(serializers.ModelSerializer):
    class Meta:
        model = PickedMovie
        fields = '__all__'
        read_only_fields = ('id', 'user', 'picked_at')


class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password')

    def create(self, validated_data):
        # Use Django's built-in password hashing.
        return User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"],
        )
