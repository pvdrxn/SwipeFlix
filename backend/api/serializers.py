from rest_framework import serializers
from django.contrib.auth.models import User
from .models import PickedMovie


class PickedMovieSerializer(serializers.ModelSerializer):
    class Meta:
        model = PickedMovie
        fields = '__all__'
        read_only_fields = ('id', 'user', 'picked_at')


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ('id', 'username', 'password')

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data["username"],
            password=validated_data["password"],
        )
