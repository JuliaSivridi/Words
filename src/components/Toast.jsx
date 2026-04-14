import { useEffect, useState } from 'react'
import styles from './Toast.module.css'

export default function Toast({ message, onDone }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(onDone, 300) // wait for fade-out before unmounting
    }, 2500)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className={`${styles.toast} ${visible ? styles.show : styles.hide}`}>
      {message}
    </div>
  )
}
