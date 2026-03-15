from rest_framework import serializers
from .models import NotificationSettings, BillingSettings
from apps.restaurant.serializers import RestaurantSerializer


class NotificationSettingsSerializer(serializers.ModelSerializer):
    restaurant = RestaurantSerializer(read_only=True)
    restaurant_id = serializers.PrimaryKeyRelatedField(queryset=[], source='restaurant', write_only=True, required=False)

    class Meta:
        model = NotificationSettings
        fields = ['id', 'restaurant', 'restaurant_id', 'email_notifications', 'sms_notifications',
                  'stock_alerts', 'reservation_alerts', 'command_alerts', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        from apps.restaurant.models import Restaurant
        self.fields['restaurant_id'].queryset = Restaurant.objects.all()


class BillingSettingsSerializer(serializers.ModelSerializer):
    default_vat_rate = serializers.DecimalField(
        source='tva_par_defaut', max_digits=5, decimal_places=2, required=False
    )
    currency = serializers.CharField(source='devise', max_length=10, required=False)
    auto_invoice = serializers.BooleanField(source='facture_auto', required=False)
    restaurant = RestaurantSerializer(read_only=True)
    restaurant_id = serializers.PrimaryKeyRelatedField(queryset=[], source='restaurant', write_only=True, required=False)

    class Meta:
        model = BillingSettings
        fields = ['id', 'restaurant', 'restaurant_id', 'default_vat_rate', 'currency',
                  'auto_invoice', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        from apps.restaurant.models import Restaurant
        self.fields['restaurant_id'].queryset = Restaurant.objects.all()

    def create(self, validated_data):
        tva = validated_data.get('default_vat_rate') or validated_data.get('tva_par_defaut')
        return BillingSettings.objects.create(
            restaurant=validated_data['restaurant'],
            tva_par_defaut=tva if tva is not None else 0,
            devise=validated_data.get('currency') or validated_data.get('devise', 'EUR'),
            facture_auto=validated_data.get('auto_invoice', validated_data.get('facture_auto', False)),
        )

    def update(self, instance, validated_data):
        tva = validated_data.get('default_vat_rate', validated_data.get('tva_par_defaut'))
        if tva is not None:
            instance.tva_par_defaut = tva
        cur = validated_data.get('currency', validated_data.get('devise'))
        if cur is not None:
            instance.devise = cur
        if 'auto_invoice' in validated_data or 'facture_auto' in validated_data:
            instance.facture_auto = validated_data.get('auto_invoice', validated_data.get('facture_auto', instance.facture_auto))
        if 'restaurant' in validated_data:
            instance.restaurant = validated_data['restaurant']
        instance.save()
        return instance

