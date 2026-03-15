from rest_framework import serializers
from .models import Report
from apps.restaurant.serializers import RestaurantSerializer


class ReportSerializer(serializers.ModelSerializer):
    report_type = serializers.CharField(source='type_report')
    period_start = serializers.DateField(source='periode_debut')
    period_end = serializers.DateField(source='periode_fin')
    file = serializers.FileField(source='fichier', required=False, allow_null=True)
    file_url = serializers.SerializerMethodField()
    restaurant = RestaurantSerializer(read_only=True)
    restaurant_id = serializers.PrimaryKeyRelatedField(queryset=[], source='restaurant', write_only=True, required=False)

    class Meta:
        model = Report
        fields = ['id', 'restaurant', 'restaurant_id', 'report_type', 'period_start',
                 'period_end', 'file', 'file_url', 'generated_at', 'created_by']
        read_only_fields = ['id', 'generated_at', 'created_by']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        from apps.restaurant.models import Restaurant
        self.fields['restaurant_id'].queryset = Restaurant.objects.all()

    def get_file_url(self, obj) -> str | None:
        if obj.fichier:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.fichier.url)
            return obj.fichier.url
        return None

    def create(self, validated_data):
        from apps.reports.models import Report
        return Report.objects.create(
            restaurant=validated_data['restaurant'],
            type_report=validated_data['report_type'],
            periode_debut=validated_data['period_start'],
            periode_fin=validated_data['period_end'],
            fichier=validated_data.get('file'),
            created_by=validated_data.get('created_by'),
        )

    def update(self, instance, validated_data):
        instance.type_report = validated_data.get('report_type', instance.type_report)
        instance.periode_debut = validated_data.get('period_start', instance.periode_debut)
        instance.periode_fin = validated_data.get('period_end', instance.periode_fin)
        if 'file' in validated_data:
            instance.fichier = validated_data['file']
        if 'restaurant' in validated_data:
            instance.restaurant = validated_data['restaurant']
        instance.save()
        return instance

