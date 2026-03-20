import styles from './NextButton.module.css'

export default function NextButton({ onClick, disabled, label = 'Next →' }) {
  return (
    <div className={styles.wrapper}>
      <button
        className={`btn btn-primary btn-full ${styles.btn}`}
        onClick={onClick}
        disabled={disabled}
      >
        {label}
      </button>
    </div>
  )
}
