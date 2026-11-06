/* ============================================================
   Schema registry
   ============================================================ */
import {blockTypes} from './blocks.js'
import {drawing} from './drawing.js'
import {project} from './project.js'

export const schemaTypes = [project, drawing, ...blockTypes]
