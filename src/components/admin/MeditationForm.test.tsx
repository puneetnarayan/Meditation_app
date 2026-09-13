import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { NewMeditationInput } from '../../types'
import { MeditationForm } from './MeditationForm'

describe('MeditationForm', () => {
  it('submits a fully filled-out new meditation', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <MeditationForm
        submitLabel="Add meditation"
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    )

    await user.type(screen.getByLabelText('Title'), 'Lunch Reset')
    await user.type(
      screen.getByLabelText('Description'),
      'A short reset for the middle of the day.',
    )
    await user.selectOptions(screen.getByLabelText('Category'), 'Stress')
    await user.clear(screen.getByLabelText('Duration (minutes)'))
    await user.type(screen.getByLabelText('Duration (minutes)'), '5')
    await user.click(screen.getByLabelText('Quick reset'))
    await user.click(screen.getByLabelText('Featured'))
    await user.type(
      screen.getByLabelText('Audio URL (optional)'),
      'https://example.com/audio/lunch-reset.mp3',
    )

    await user.click(screen.getByRole('button', { name: 'Add meditation' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    const submitted = onSubmit.mock.calls[0][0] as NewMeditationInput
    expect(submitted.title).toBe('Lunch Reset')
    expect(submitted.categoryId).toBe('cat-stress')
    expect(submitted.durationSeconds).toBe(300)
    expect(submitted.tags).toEqual(['quick-reset'])
    expect(submitted.isFeatured).toBe(true)
    expect(submitted.isPremium).toBe(false)
    expect(submitted.audioUrl).toBe('https://example.com/audio/lunch-reset.mp3')
  })

  it('omits audioUrl when the field is left blank', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <MeditationForm
        submitLabel="Add meditation"
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    )

    await user.type(screen.getByLabelText('Title'), 'Lunch Reset')
    await user.type(
      screen.getByLabelText('Description'),
      'A short reset for the middle of the day.',
    )
    await user.click(screen.getByRole('button', { name: 'Add meditation' }))

    const submitted = onSubmit.mock.calls[0][0] as NewMeditationInput
    expect(submitted.audioUrl).toBeUndefined()
  })

  it('does not submit without a title or description', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <MeditationForm
        submitLabel="Add meditation"
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Add meditation' }))

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('pre-fills fields from initialValues for editing', () => {
    render(
      <MeditationForm
        initialValues={{
          title: 'Morning Calm',
          description: 'Existing description.',
          categoryId: 'cat-morning',
          durationSeconds: 600,
          type: 'guided',
          difficulty: 'beginner',
          tags: ['morning-routine'],
          audioUrl: 'https://example.com/audio/morning-calm.mp3',
          isPremium: false,
          isFeatured: true,
        }}
        submitLabel="Save changes"
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('Title')).toHaveValue('Morning Calm')
    expect(screen.getByLabelText('Duration (minutes)')).toHaveValue(10)
    expect(screen.getByLabelText('Featured')).toBeChecked()
    expect(screen.getByLabelText('Morning routine')).toBeChecked()
    expect(screen.getByLabelText('Audio URL (optional)')).toHaveValue(
      'https://example.com/audio/morning-calm.mp3',
    )
  })

  it('calls onCancel when Cancel is clicked', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(
      <MeditationForm
        submitLabel="Add meditation"
        onSubmit={vi.fn()}
        onCancel={onCancel}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
