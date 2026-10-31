import { chemistryQuestions } from './chemistry'
import { physicsQuestions } from './physics'
import { spaceQuestions } from './space'
import { historyQuestions } from './history'
import { natureQuestions } from './nature'
import { technologyQuestions } from './technology'
import { artQuestions } from './art'
import { biologyQuestions } from './biology'
import { geographyQuestions } from './geography'
import { mathematicsQuestions } from './mathematics'
import { linguisticsQuestions } from './linguistics'
import { cinemaQuestions } from './cinema'
import { musicQuestions } from './music'
import { peopleQuestions } from './people'
import { bibleQuestions } from './bible'

// Append new editions to each subject without renumbering existing questions.
export const expandedQuestions = [
  ...chemistryQuestions, ...physicsQuestions, ...spaceQuestions,
  ...historyQuestions, ...natureQuestions, ...technologyQuestions,
  ...artQuestions, ...biologyQuestions, ...geographyQuestions,
  ...mathematicsQuestions, ...linguisticsQuestions, ...cinemaQuestions,
  ...musicQuestions, ...peopleQuestions, ...bibleQuestions,
]
