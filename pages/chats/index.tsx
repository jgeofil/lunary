import { NextSeo } from "next-seo"
import Router, { useRouter } from "next/router"
import { useEffect, useState } from "react"

import AppUserAvatar from "@/components/Blocks/AppUserAvatar"
import DataTable from "@/components/Blocks/DataTable"
import Feedback from "@/components/Blocks/Feedback"
import Empty from "@/components/Layout/Empty"

import {
  durationColumn,
  feedbackColumn,
  inputColumn,
  tagsColumn,
  timeColumn,
  userColumn,
} from "@/utils/datatable"

import {
  useAllFeedbacks,
  useAppUser,
  useConvosByFeedback,
  useRuns,
} from "@/utils/dataHooks"
import { formatDateTime } from "@/utils/format"

import {
  Button,
  Card,
  Drawer,
  Flex,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from "@mantine/core"

import { IconMessages, IconNeedleThread } from "@tabler/icons-react"
import FacetedFilter from "../../components/Blocks/FacetedFilter"
import analytics from "../../utils/analytics"
import RunsChat from "@/components/Blocks/RunChat"

const columns = [
  timeColumn("created_at", "Started at"),
  durationColumn("full"),
  userColumn(),
  inputColumn("Last Message"),
  tagsColumn(),
  feedbackColumn(true),
]

function ChatReplay({ run }) {
  const { runs, loading } = useRuns("chat", {
    match: { parent_run: run.id },
    notInfinite: true,
  })

  const { user } = useAppUser(run.user)

  return (
    <Stack>
      <Card withBorder radius="md">
        <Stack gap="xs">
          <Group justify="space-between">
            <Text>User</Text>
            <Text>
              {user ? (
                <AppUserAvatar size="sm" user={user} withName />
              ) : (
                "Unknown"
              )}
            </Text>
          </Group>
          <Group justify="space-between">
            <Text>First message</Text>
            <Text>{formatDateTime(run.created_at)}</Text>
          </Group>
          <Group justify="space-between">
            <Text>Last message</Text>
            <Text>{formatDateTime(run.ended_at)}</Text>
          </Group>
        </Stack>
      </Card>
      <Button
        variant="outline"
        onClick={() => {
          Router.push(`/traces/${run.id}`)
        }}
        rightSection={<IconNeedleThread size="16" />}
      >
        View trace
      </Button>

      <Title order={3}>Replay</Title>

      <RunsChat runs={runs} />
    </Stack>
  )
}

export default function Chats() {
  const router = useRouter()
  const [selectedItems, setSelectedItems] = useState([])
  const [selected, setSelected] = useState()

  const { runIds } = useConvosByFeedback(selectedItems)
  let { runs, loading, validating, loadMore } = useRuns(
    null,
    {
      filter: ["type", "in", '("convo","thread")'],
    },
    runIds,
  )

  useEffect(() => {
    if (loading === false) {
      const defaultSelectedRun = runs.find(({ id }) => id === router.query.chat)
      setSelected(defaultSelectedRun)
    }
  }, [loading])

  const { allFeedbacks } = useAllFeedbacks()

  if (!loading && runs?.length === 0) {
    return <Empty Icon={IconMessages} what="conversations" />
  }

  return (
    <Stack h={"calc(100vh - var(--navbar-size))"}>
      <NextSeo title="Chats" />
      <Flex justify="space-between">
        <Group>
          {allFeedbacks?.length && (
            <FacetedFilter
              name="Feedbacks"
              items={allFeedbacks}
              render={(item) => <Feedback data={item} />}
              selectedItems={selectedItems}
              setSelectedItems={setSelectedItems}
              withSearch={false}
            />
          )}
        </Group>
      </Flex>
      {loading && <Loader />}

      <Drawer
        opened={!!selected}
        keepMounted
        size="lg"
        position="right"
        title={<Title order={3}>Thread details</Title>}
        onClose={() => {
          router.replace(`/chats`)
          setSelected(null)
        }}
      >
        {selected && <ChatReplay run={selected} />}
      </Drawer>

      <DataTable
        type="chats"
        onRowClicked={(row) => {
          analytics.trackOnce("OpenChat")
          router.push(`/chats?chat=${row.id}`)
          setSelected(row)
        }}
        loading={loading || validating}
        loadMore={loadMore}
        columns={columns}
        data={runs}
      />
    </Stack>
  )
}
