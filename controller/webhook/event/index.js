const dispatch = [
	{
		type: "charge.success",
		handler: require("./charge.success"),
	},
];

const dispatchEvent = async (eventType, eventData) => {
	const event = dispatch.find((item) => item.type === eventType);
	if (!event) {
		console.log(`No handler registered for event: ${eventType}`);
		return;
	}
	return event.handler(eventData);
};

module.exports = dispatchEvent;
