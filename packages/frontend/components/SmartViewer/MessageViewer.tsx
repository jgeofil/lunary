import { ChatMessage } from "@/components/SmartViewer/Message"
import { Box, Stack } from "@mantine/core"

function getLastMessage(messages) {
  if (Array.isArray(messages)) {
    return messages[messages.length - 1]
  }

  return messages
}

export default function MessageViewer({ data, compact, markdown }) {
  const obj = Array.isArray(data) ? data : [data]

  return compact ? (
    <ChatMessage data={getLastMessage(obj)} compact markdown={markdown} />
  ) : (
    <Box mah={700} style={{ overflowY: "auto" }}>
      <Stack>
        {obj.map((message, i) => (
          <ChatMessage key={i} data={message} markdown={markdown} />
        ))}
      </Stack>
    </Box>
  )
}
