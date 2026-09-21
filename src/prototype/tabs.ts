import { fadeTab } from './FadeTab'
import { figureTab } from './FigureTab'
import { scrubTab } from './ScrubTab'
import type { ProtoTab } from './types'

/**
 * Every tab of the prototype panel, left to right. A new one is a file next to
 * this that exports a `ProtoTab`, and a line here. Nothing else changes.
 */
export const PROTO_TABS: ProtoTab[] = [figureTab, fadeTab, scrubTab]
