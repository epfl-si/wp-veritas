import React, { useEffect, useState } from 'react'
import { PropTypes } from 'prop-types'

class Case {
  static PLUGIN_NOT_RESPONDING = new Case('PLUGIN_NOT_RESPONDING', 'Unexpected error: no information available on the API. Is the plugin enabled on this website?')
  static '404_NOT_FOUND' = new Case('404_NOT_FOUND', 'Error 404: The requested page does not exist')
  static REQUEST_ERROR = new Case('REQUEST_ERROR', 'Request error: an error occured during the data fetching')
  static SUCCESS = new Case('SUCCESS', 'SUCCESS')

  constructor (name, description) {
    this.name = name
    this.description = description
  }
}

function LastChange (props) {
  LastChange.propTypes = {
    url: PropTypes.string.isRequired
  }
  useEffect(() => {
    resetRequest()
    fetch(props.url)
      .then(response => {
        return response.json()
      })
      .then(data => {
        if (data === 404) {
          setRequestStatus(Case['404_NOT_FOUND'])
        } else if (data.data && data.data.status === 404) {
          setRequestStatus(Case.PLUGIN_NOT_RESPONDING)
        } else {
          const obj = data[0]
          setRequestStatus(Case.SUCCESS)
          setUsername(obj.username)
          setLastChangeDate(obj.last_modified)
        }
      })
      .catch(error => {
        console.log(error)
        setRequestStatus(Case.REQUEST_ERROR)
      })
  }, [props.url])
  const [lastChangeDate, setLastChangeDate] = useState()
  const [username, setUsername] = useState('')
  const [requestStatus, setRequestStatus] = useState('')
  const resetRequest = () => {
    setRequestStatus('')
    setLastChangeDate('')
    setUsername('')
  }
  const message = (() => {
    if (requestStatus === '') {
      return <>loading...</>
    } else if (!(requestStatus instanceof Case)) {
      return <></>
    } else if (requestStatus !== Case.SUCCESS) {
      return requestStatus.description
    } else {
      return <span>{ lastChangeDate } par <a href={`https://search.epfl.ch/?filter=people&q=${username}`}>{username}</a></span>
    }
  }
  )()
  return (
    <>
      Dernière modification le : {message}
    </>
  )
}

export default LastChange
