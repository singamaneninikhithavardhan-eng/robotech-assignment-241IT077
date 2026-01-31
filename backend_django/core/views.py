from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.http import HttpResponse
import csv
from .models import (
    Announcement, GalleryImage, Sponsorship, ContactMessage, 
    Form, FormSection, FormField, FormResponse
)
from .serializers import (
    AnnouncementSerializer, GalleryImageSerializer, SponsorshipSerializer, 
    ContactMessageSerializer, FormSerializer, FormSectionSerializer, 
    FormFieldSerializer, FormResponseSerializer
)
from users.permissions import GlobalPermission

class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset = Announcement.objects.all().order_by('-created_at')
    serializer_class = AnnouncementSerializer
    permission_classes = [GlobalPermission]

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        ann = self.get_object()
        ann.published_at = timezone.now()
        ann.save()
        return Response({'status': 'published'})

class GalleryViewSet(viewsets.ModelViewSet):
    permission_classes = [GlobalPermission]
    serializer_class = GalleryImageSerializer

    def get_queryset(self):
        qs = GalleryImage.objects.all().order_by('-uploaded_at')
        event_id = self.request.query_params.get('event')
        if event_id:
            qs = qs.filter(event_id=event_id)
        return qs

    @action(detail=False, methods=['post'])
    def upload(self, request):
        images = request.FILES.getlist('images')
        title = request.POST.get('title', '')
        event_id = request.POST.get('event_id')
        
        event_obj = None
        if event_id:
             try:
                 from events.models import Event
                 event_obj = Event.objects.get(id=event_id)
             except (Event.DoesNotExist, ValueError):
                 pass

        created = []
        for img in images:
            obj = GalleryImage.objects.create(
                image=img, 
                uploaded_by=request.user,
                title=title,
                event=event_obj
            )
            created.append(obj)
        return Response(GalleryImageSerializer(created, many=True).data)

    @action(detail=True, methods=['delete'])
    def image(self, request, pk=None):
        return self.destroy(request, pk)

class SponsorshipViewSet(viewsets.ModelViewSet):
    queryset = Sponsorship.objects.all().order_by('-created_at')
    serializer_class = SponsorshipSerializer
    permission_classes = [GlobalPermission]

class ContactMessageViewSet(viewsets.ModelViewSet):
    queryset = ContactMessage.objects.all().order_by('-created_at')
    serializer_class = ContactMessageSerializer
    permission_classes = [GlobalPermission]

# --- DYNAMIC FORMS ---

class FormViewSet(viewsets.ModelViewSet):
    queryset = Form.objects.all().order_by('-created_at')
    serializer_class = FormSerializer
    permission_classes = [GlobalPermission]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['get'])
    def responses(self, request, pk=None):
        form = self.get_object()
        responses = form.responses.all().order_by('-submitted_at')
        return Response(FormResponseSerializer(responses, many=True).data)

    @action(detail=True, methods=['get'])
    def export_responses_csv(self, request, pk=None):
        form = self.get_object()
        responses = form.responses.all().order_by('-submitted_at')
        fields = form.fields.all().order_by('order')
        
        response = HttpResponse(content_type='text/csv')
        filename = f"{form.title.replace(' ', '_')}_responses.csv"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'

        writer = csv.writer(response)
        
        # Headers
        headers = ['Response ID', 'User', 'Submitted At'] + [f.label for f in fields]
        writer.writerow(headers)

        for resp in responses:
            user_str = resp.user.username if resp.user else 'Anonymous'
            row = [
                resp.id, 
                user_str, 
                resp.submitted_at.strftime("%Y-%m-%d %H:%M:%S")
            ]
            
            # Map data
            data = resp.data or {}
            for field in fields:
                val = data.get(field.label, '')
                if isinstance(val, list): val = ", ".join(map(str, val))
                row.append(str(val))
            
            writer.writerow(row)
            
        return response

class FormSectionViewSet(viewsets.ModelViewSet):
    queryset = FormSection.objects.all()
    serializer_class = FormSectionSerializer
    permission_classes = [GlobalPermission]

class FormFieldViewSet(viewsets.ModelViewSet):
    queryset = FormField.objects.all()
    serializer_class = FormFieldSerializer
    permission_classes = [GlobalPermission]

class FormResponseViewSet(viewsets.ModelViewSet):
    queryset = FormResponse.objects.all()
    serializer_class = FormResponseSerializer
    permission_classes = [GlobalPermission]

    def create(self, request, *args, **kwargs):
        form_id = request.data.get('form')
        submitted_data = request.data.get('data', {})

        try:
            form = Form.objects.prefetch_related('fields').get(id=form_id)
        except (Form.DoesNotExist, ValueError):
            return Response({"error": "Form not found"}, status=status.HTTP_404_NOT_FOUND)

        if not form.is_active:
            return Response({"error": "This form is currently offline"}, status=status.HTTP_400_BAD_REQUEST)

        if form.closes_at and form.closes_at < timezone.now():
            return Response({"error": "This form has automatically closed (deadline passed)"}, status=status.HTTP_400_BAD_REQUEST)

        # SANITATION & VALIDATION
        sanitized_data = {}
        form_fields = form.fields.all()
        
        for field in form_fields:
            val = submitted_data.get(field.label)
            
            # Check Required
            if field.required and not val and val is not False:
                 return Response({"error": f"Field '{field.label}' is compulsory."}, status=status.HTTP_400_BAD_REQUEST)
            
            # Map only existing fields
            if field.label in submitted_data:
                sanitized_data[field.label] = submitted_data[field.label]

        # Update request data for serializer
        mutable_data = request.data.copy()
        mutable_data['data'] = sanitized_data
        
        serializer = self.get_serializer(data=mutable_data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user if self.request.user.is_authenticated else None)
