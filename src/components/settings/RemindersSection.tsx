import { useState, type FormEvent } from 'react'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import { Switch } from '../common/Switch'
import { useReminders } from '../../hooks/useReminders'
import styles from './RemindersSection.module.css'

export function RemindersSection() {
  const {
    reminders,
    permission,
    requestPermission,
    toggleReminder,
    setReminderTime,
    addReminder,
    removeReminder,
  } = useReminders()
  const [newLabel, setNewLabel] = useState('')
  const [newTime, setNewTime] = useState('12:00')

  const builtIn = reminders.filter((reminder) => reminder.kind !== 'custom')
  const custom = reminders.filter((reminder) => reminder.kind === 'custom')

  function handleAddCustom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!newLabel.trim()) return
    addReminder(newLabel.trim(), newTime)
    setNewLabel('')
    setNewTime('12:00')
  }

  return (
    <section className={styles.section}>
      <h2>Reminders</h2>
      <p className={styles.description}>
        Optional reminders to meditate. Notifications are off unless you enable
        them, and you can turn them off again at any time.
      </p>

      {permission === 'unsupported' && (
        <p className={styles.notice}>
          This browser doesn't support notifications, so reminders can't be
          shown here.
        </p>
      )}

      {permission === 'default' && (
        <Button onClick={() => void requestPermission()}>
          Enable notifications
        </Button>
      )}

      {permission === 'denied' && (
        <p className={styles.notice}>
          Notifications are blocked for this site. Allow them in your browser's
          site settings to receive reminders.
        </p>
      )}

      {permission === 'granted' && (
        <>
          <ul className={styles.list}>
            {builtIn.map((reminder) => (
              <li key={reminder.id} className={styles.row}>
                <Switch
                  label={reminder.label}
                  checked={reminder.enabled}
                  onChange={(event) =>
                    toggleReminder(reminder.id, event.target.checked)
                  }
                />
                <Input
                  label={`${reminder.label} time`}
                  type="time"
                  value={reminder.time}
                  onChange={(event) =>
                    setReminderTime(reminder.id, event.target.value)
                  }
                />
              </li>
            ))}

            {custom.map((reminder) => (
              <li key={reminder.id} className={styles.row}>
                <Switch
                  label={reminder.label}
                  checked={reminder.enabled}
                  onChange={(event) =>
                    toggleReminder(reminder.id, event.target.checked)
                  }
                />
                <Input
                  label={`${reminder.label} time`}
                  type="time"
                  value={reminder.time}
                  onChange={(event) =>
                    setReminderTime(reminder.id, event.target.value)
                  }
                />
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => removeReminder(reminder.id)}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>

          <form className={styles.addForm} onSubmit={handleAddCustom}>
            <Input
              label="Custom reminder"
              placeholder="e.g. Lunch break"
              value={newLabel}
              onChange={(event) => setNewLabel(event.target.value)}
            />
            <Input
              label="Time"
              type="time"
              value={newTime}
              onChange={(event) => setNewTime(event.target.value)}
            />
            <Button type="submit" variant="secondary">
              Add reminder
            </Button>
          </form>
        </>
      )}
    </section>
  )
}
