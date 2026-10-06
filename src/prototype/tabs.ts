import { factTab } from './FactTab'
import { knobTab } from './KnobTab'
import { layoutTab } from './LayoutTab'
import { lightTab } from './LightTab'
import { railTab } from './RailTab'
import { scrubTab } from './ScrubTab'
import type { ProtoTab } from './types'

/**
 * Every tab of the prototype panel, left to right. A new one is a file next to
 * this that exports a `ProtoTab`, and a line here. Nothing else changes.
 */
export const PROTO_TABS: ProtoTab[] = [knobTab, scrubTab, lightTab, railTab, layoutTab, factTab]
