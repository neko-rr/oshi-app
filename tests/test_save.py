import base64
from app import save_registration, _serialise_state, _empty_registration_state

sample_image_bytes = base64.b64encode(b'SampleImageBytes').decode('ascii')

state = _empty_registration_state()
state['barcode'] = {
    'value': '1234567890123',
    'type': 'EAN-13',
    'status': 'captured',
    'source': 'manual',
    'filename': 'code.png'
}
state['front_photo'] = {
    'content': 'data:image/png;base64,' + sample_image_bytes,
    'filename': 'front.png',
    'content_type': 'image/png',
    'status': 'captured',
    'description': 'Test description'
}
state['lookup'] = {
    'status': 'success',
    'items': [{'name': 'Test Product'}],
    'message': '',
    'source': 'test'
}
state['tags'] = {
    'status': 'success',
    'tags': ['tag1', 'tag2'],
    'message': ''
}

serialized_state = _serialise_state(state)

result = save_registration(
    n_clicks=1,
    store_data=serialized_state,
    note='note from step',
    selected_tags=['tag1', 'tag3'],
    final_note='final note'
)
print('save_registration result:', result)
