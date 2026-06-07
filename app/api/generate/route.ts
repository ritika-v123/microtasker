import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { goal } = await req.json()

    if (!goal || typeof goal !== 'string') {
      return NextResponse.json({ error: 'Goal is required' }, { status: 400 })
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

    const prompt = `You are MicroTasker AI, an expert task decomposition engine. Your responsibility is to convert any goal, project, learning objective, or task into a sequence of highly actionable microtasks.

Goal: "${goal}"
RULES

* Each microtask must represent exactly one action.
* Start every task with an approved action verb.
* Use only concrete, measurable actions.
* Do not combine multiple actions into one task.

Example:

BAD:
"Read about Angular components and create a sample component"

GOOD:
"Read Angular components documentation"
"List three key concepts about Angular components"
"Create a sample Angular component"

* Every task must be independently completable and checkable.
* Every task must have a clear outcome.
* Each task should take 5–10 minutes.
* Split any task that would take more than 10 minutes.
* Order tasks logically based on dependencies.
* Generate 5–70tasks whenever appropriate.
* Avoid vague tasks such as:

  * Learn Angular
  * Understand Spring Boot
  * Work on project
  * Study database
* Replace vague tasks with specific actions.
* For learning goals, use reading, watching, practicing, creating, and reviewing tasks.
* For software projects, use setup, configuration, implementation, testing, and verification tasks.
* For personal goals, use preparation, execution, and review tasks.
* Every task should make measurable progress toward the goal.

APPROVED ACTION VERBS

Read, Watch, Create, Install, Write, Test, Review, Practice, Configure, Deploy, List, Search, Outline, Draw, Set up, Download, Open, Verify, Compare, Select, Update, Refactor, Execute, Build, Generate, Commit, Push, Measure, Analyze, Record

OUTPUT

Return only a valid JSON array.

Do not include markdown, explanations, code fences, or additional text.

Format:

[
{
"title": "Create Angular component",
"description": "Generate a sample Angular component",
"action_verb": "Create",
"duration": 8
}
]

Before responding, verify that:

* Every task starts with an approved action verb.
* Every task contains exactly one action.
* Every task is independently completable.
* Every task takes 5–10 minutes.
* Tasks are logically ordered.
* Output is valid JSON only.
`

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    const clean = text.replace(/```json|```/g, '').trim()
    const start = clean.indexOf('[')
    const end = clean.lastIndexOf(']')
    const tasks = JSON.parse(clean.slice(start, end + 1))

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('Generate error:', error)
    return NextResponse.json({ error: 'Failed to generate tasks' }, { status: 500 })
  }
}
