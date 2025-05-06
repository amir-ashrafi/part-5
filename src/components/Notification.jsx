const Notification = ({ message, type }) => {
  if (!message) return null

  const style = {
    padding: 10,
    border: '1px solid',
    borderColor: type === 'error' ? 'red' : 'green',
    marginBottom: 15,
    backgroundColor: '#f9f9f9'
  }

  return (
    <div style={style}>
      {message}
    </div>
  )
}

export default Notification