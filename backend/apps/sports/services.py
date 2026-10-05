from django.db import transaction
from .models import Sport
from apps.accounts.services import log_audit

@transaction.atomic
def create_sport(user, validated_data):
    sport = Sport.objects.create(**validated_data)
    log_audit(user, "SPORT_CREATED", "Sport", sport.id, f"Created sport '{sport.name}'")
    return sport

@transaction.atomic
def update_sport(user, sport, validated_data):
    for key, val in validated_data.items():
        setattr(sport, key, val)
    sport.save()
    log_audit(user, "SPORT_UPDATED", "Sport", sport.id, f"Updated sport '{sport.name}'")
    return sport

@transaction.atomic
def delete_sport(user, sport):
    name = sport.name
    sport_id = sport.id
    sport.delete()
    log_audit(user, "SPORT_DELETED", "Sport", sport_id, f"Deleted sport '{name}'")
    return True
