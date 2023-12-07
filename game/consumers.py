import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer


class GameConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.room_code = self.scope["url_route"]["kwargs"]["room_code"]
        self.room_group_code = "room_%s" % self.room_code

        # Join room group
        await self.channel_layer.group_add(self.room_group_code, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(self.room_group_code, self.channel_name)

    async def receive(self, text_data):
        """
        Receive message from WebSocket.
        Get the event and send the appropriate event
        """
        response = json.loads(text_data)
        event = response.get("event", None)
        message = response.get("message", None)
        if event == "MOVE":
            # Send message to room group
            await self.channel_layer.group_send(
                self.room_group_code,
                {"type": "send_message", "message": message, "event": "MOVE"},
            )

        if event == "START":
            # Send message to room group
            await self.channel_layer.group_send(
                self.room_group_code,
                {"type": "send_message", "message": message, "event": "START"},
            )

        if event == "END":
            # Send message to room group
            await self.channel_layer.group_send(
                self.room_group_code,
                {"type": "send_message", "message": message, "event": "END"},
            )

        if event == "READY":
            # Send message to room group
            await self.channel_layer.group_send(
                self.room_group_code,
                {"type": "send_message", "message": message, "event": "START"},
            )

        if event == "PASS":
            # Send message to room group
            await self.channel_layer.group_send(
                self.room_group_code,
                {"type": "send_message", "message": message, "event": "PASS"},
            )

        if event == "GIVEUP":
            # Send message to room group
            await self.channel_layer.group_send(
                self.room_group_code,
                {"type": "send_message", "message": message, "event": "GIVEUP"},
            )

        if event == "GYEGASUGGEST":
            # Send message to room group
            await self.channel_layer.group_send(
                self.room_group_code,
                {"type": "send_message", "message": message, "event": "GYEGASUGGEST"},
            )

        if event == "GYEGAREFUSE":
            # Send message to room group
            await self.channel_layer.group_send(
                self.room_group_code,
                {"type": "send_message", "message": message, "event": "GYEGAREFUSE"},
            )

        if event == "GYEGAAGREE":
            # Send message to room group
            await self.channel_layer.group_send(
                self.room_group_code,
                {"type": "send_message", "message": message, "event": "GYEGAAGREE"},
            )

        if event == "GYEGADISAGREE":
            # Send message to room group
            await self.channel_layer.group_send(
                self.room_group_code,
                {"type": "send_message", "message": message, "event": "GYEGADISAGREE"},
            )

    async def send_message(self, res):
        """Receive message from room group"""
        # Send message to WebSocket
        await self.send(
            text_data=json.dumps(
                {
                    "payload": res,
                }
            )
        )
