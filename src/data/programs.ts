import type { Program } from '../types'

export const programs: Program[] = [
  {
    id: 'program-7-days-of-calm',
    title: '7 Days of Calm',
    description:
      'A week of short, calming practices to ease stress and settle into the present.',
    totalDays: 7,
    categoryId: 'cat-relaxation',
    isFeatured: true,
  },
  {
    id: 'program-10-days-of-better-sleep',
    title: '10 Days of Better Sleep',
    description:
      'Wind down each night with guided body scans and visualizations for deeper rest.',
    totalDays: 10,
    categoryId: 'cat-sleep',
    isFeatured: false,
  },
  {
    id: 'program-14-days-of-mindfulness',
    title: '14 Days of Mindfulness',
    description:
      'Two weeks of present-moment awareness practices to build a steady mindfulness habit.',
    totalDays: 14,
    categoryId: 'cat-mindfulness',
    isFeatured: false,
  },
  {
    id: 'program-21-days-of-focus',
    title: '21 Days of Focus',
    description:
      'Three weeks of concentration practices to sharpen focus and reduce mental clutter.',
    totalDays: 21,
    categoryId: 'cat-focus',
    isFeatured: false,
  },
  {
    id: 'program-stress-reduction',
    title: 'Stress Reduction Program',
    description:
      'A focused week of practices to release tension and build resilience to stress.',
    totalDays: 7,
    categoryId: 'cat-stress',
    isFeatured: true,
  },
]
