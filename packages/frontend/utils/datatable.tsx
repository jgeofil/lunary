import AppUserAvatar from "@/components/blocks/AppUserAvatar"
import Feedback from "@/components/blocks/OldFeedback"
import ProtectedText from "@/components/blocks/ProtectedText"
import SmartViewer from "@/components/SmartViewer"
import { Badge, Group, Tooltip } from "@mantine/core"
import { createColumnHelper } from "@tanstack/react-table"
import { useEffect } from "react"
import analytics from "./analytics"

import { formatCost, formatDateTime, msToTime } from "./format"
import { useProjectSWR } from "./dataHooks"
import {
  IconMoodNeutral,
  IconMoodSad,
  IconMoodSmile,
} from "@tabler/icons-react"
const columnHelper = createColumnHelper<any>()

export function timeColumn(timeColumn, label = "Time") {
  return columnHelper.accessor(timeColumn, {
    header: label,
    id: timeColumn,
    size: 80,
    sortingFn: (a, b) =>
      new Date(a.getValue(timeColumn)).getTime() -
      new Date(b.getValue(timeColumn)).getTime(),
    cell: (info) => {
      const isToday =
        new Date(info.getValue()).toDateString() === new Date().toDateString()
      if (isToday) {
        return new Date(info.getValue()).toLocaleTimeString(
          typeof window !== "undefined" ? window.navigator.language : "en-US",
        )
      } else {
        return formatDateTime(info.getValue())
      }
    },
  })
}

export function durationColumn(unit = "s") {
  return {
    id: "duration",
    header: "Duration",
    size: 45,
    cell: (props) => {
      if (!props.getValue()) return null
      if (unit === "s") {
        return `${(props.getValue() / 1000).toFixed(2)}s`
      } else if (unit === "full") {
        return msToTime(props.getValue())
      }
    },
    accessorFn: (row) => {
      if (!row.endedAt) {
        return NaN
      }

      const duration =
        new Date(row.endedAt).getTime() - new Date(row.createdAt).getTime()
      return duration
    },
  }
}

export function statusColumn() {
  return columnHelper.accessor("status", {
    id: "status",
    header: "Status",
    size: 60,
    cell: (props) => (
      <Badge color={props.getValue() === "success" ? "green" : "red"}>
        <ProtectedText>{props.getValue()}</ProtectedText>
      </Badge>
    ),
  })
}

export function tagsColumn() {
  return columnHelper.accessor("tags", {
    header: "Tags",
    size: 70,
    cell: (props) => {
      const tags = props.getValue()

      useEffect(() => {
        // Feature tracking
        if (tags) analytics.trackOnce("HasTags")
      }, [tags])

      if (!tags) return null

      return (
        <Group gap={4}>
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              style={{
                textTransform: "none",
                maxWidth: "100%",
              }}
            >
              {tag}
            </Badge>
          ))}
        </Group>
      )
    },
  })
}

export function inputColumn(label = "input") {
  return columnHelper.accessor("input", {
    header: label,
    size: 200,
    enableSorting: false,
    cell: (props) => <SmartViewer data={props.getValue()} compact />,
  })
}

export function outputColumn(label = "Response") {
  return columnHelper.accessor("output", {
    header: label,
    enableSorting: false,
    cell: (props) => (
      <SmartViewer
        data={props.getValue()}
        error={props.row.original.error}
        compact
      />
    ),
  })
}

export function userColumn() {
  return columnHelper.accessor("user", {
    header: "User",
    size: 120,
    cell: (props) => {
      const user = props.getValue()

      if (!user?.id) return null

      return <AppUserAvatar size="sm" user={user} withName />
    },
  })
}

export function nameColumn(label = "Name") {
  return columnHelper.accessor("name", {
    header: label,
    size: 80,
    minSize: 30,
    cell: (props) => {
      const { status, type } = props.row.original
      const name = props.getValue()

      return (
        <Badge
          variant="outline"
          style={{
            textTransform: "none",
          }}
          color={
            status === "success" ? "green" : status === "error" ? "red" : "gray"
          }
        >
          {name || type}
        </Badge>
      )
    },
  })
}

export function costColumn() {
  return columnHelper.accessor("cost", {
    header: "Cost",
    size: 60,
    sortingFn: (a, b) => a - b,
    cell: (props) => {
      const cost = props.getValue()
      return formatCost(cost)
    },
  })
}

export function feedbackColumn(withRelatedRuns = false) {
  const cell = withRelatedRuns
    ? (props) => {
        const run = props.row.original

        const { data: relatedRuns } = useProjectSWR(`/runs/${run.id}/related`)

        const allFeedbacks = [run, ...(relatedRuns || [])]
          .filter((run) => run.feedback)
          .map((run) => run.feedback)

        return (
          <Group gap="xs">
            {allFeedbacks?.map((feedback, i) => (
              <Feedback data={feedback} key={i} />
            ))}
          </Group>
        )
      }
    : (props) => {
        const run = props.row.original

        const feedback = run.feedback || run.parentFeedback
        const isParentFeedback = !run.feedback && run.parentFeedback

        return <Feedback data={feedback} isFromParent={isParentFeedback} />
      }

  return columnHelper.accessor("feedback", {
    header: "Feedback",
    size: 100,
    cell,
  })
}

const enrichRenderer = (data) => {
  switch (data.id) {
    case "sentiment":
      let emoji
      let type

      if (data.value > 0.5) {
        emoji = <IconMoodSmile color="teal" />
        type = "positive"
      } else if (data.value < -0.5) {
        emoji = <IconMoodSad color="crimson" />
        type = "negative"
      } else {
        emoji = <IconMoodNeutral color="gray" />
        type = "neutral"
      }

      return {
        element: (
          <Group gap="xs">
            {emoji} {data.value}
          </Group>
        ),
        help: "Sentiment: " + type,
      }
    case "pii":
      return { element: data.value ? "Yes" : "No" }
    default:
      return { element: data.value, help: data.id }
  }
}

// return a value between 0 and 1, static for a given seed runID
function valueBetween0and1forRunID(runID: string) {
  const seed = parseInt(runID, 16)
  return (Math.sin(seed) + 1) / 2
}

export function enrichmentColumn() {
  return columnHelper.accessor("enrichment", {
    header: "Enrichment",
    size: 100,
    cell: (props) => {
      // for testing, random value between -1 and 1
      const runID = props.row.original.id

      const enrichedData = [
        {
          id: "sentiment",
          value: (valueBetween0and1forRunID(runID) * 2 - 1).toFixed(2),
        },
      ]

      return enrichedData.map((data) => {
        const { element, help } = enrichRenderer(data)
        return (
          <Tooltip key={data.id} label={help}>
            <div key={data.id}>{element}</div>
          </Tooltip>
        )
      })
    },
  })
}
