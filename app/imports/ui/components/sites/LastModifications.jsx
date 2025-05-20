import React, { useEffect, useState } from 'react'
import { PropTypes } from 'prop-types'

class Case {
  static PLUGIN_NOT_RESPONDING = new Case('PLUGIN_NOT_RESPONDING', "Erreur inattendue : aucune information disponible sur l'API. Le plugin est-il activé sur ce site ?")
  static '404_NOT_FOUND' = new Case('404_NOT_FOUND', "Erreur 404 : la page demandée n'existe pas")
  static REQUEST_ERROR = new Case('REQUEST_ERROR', "Erreur de requête : une erreur s'est produite lors de la récupération des données")
  static NEVER_MODIFIED = new Case('NEVER_MODIFIED', "Le site n'a jamais été modifié")
  static SUCCESS = new Case('SUCCESS', 'SUCCÈS')

  constructor (name, description) {
    this.name = name
    this.description = description
  }
}

async function fetchApi(apiCall) {
  const response = await fetch(apiCall)

  if(response.status === 404) {
    return [Case['404_NOT_FOUND'], null]
  }

  const data = await response.json()

  if (data.data && data.data.status === 404) {
    return [Case.PLUGIN_NOT_RESPONDING, null]
  } else if (Array.isArray(data) && data.length === 0) {
    return [Case.NEVER_MODIFIED, null]
  } else {
    return [Case.SUCCESS, data]
  }
}

function displayMessage(requestStatus, content) {
  if (requestStatus === '') {
    return <>loading...</>
  } else if (!(requestStatus instanceof Case)) {
    return <></>
  } else if (requestStatus !== Case.SUCCESS) {
    return requestStatus.description
  } else {
    return content
  }
}

function lastChange (siteUrl, pageUrl) {
  const apiCall = siteUrl + 'wp-json/epfl/v1/lastchange?url=' + pageUrl

  useEffect(() => {
    resetRequest()
    fetchApi(apiCall)
      .then(([status, data]) => {
        setRequestStatus(status)
        if(data) {
          const obj = data[0]
          setUsername(obj.username)
          setLastChangeDate(obj.last_modified)
        }
      })
      .catch(error => {
        console.log(error)
        setRequestStatus(Case.REQUEST_ERROR)
      })
  }, [apiCall])
  
  const [lastChangeDate, setLastChangeDate] = useState("default")
  const [username, setUsername] = useState('')
  const [requestStatus, setRequestStatus] = useState('')

  const resetRequest = () => {
    setRequestStatus('')
    setLastChangeDate('')
    setUsername('')
  }

  let content = <span>La dernière modification de la page a été faite par <a href={ `https://search.epfl.ch/?filter=people&q=${ username }` }>{ username }</a> le { lastChangeDate }.</span>

  return displayMessage(requestStatus, content)
}

function lastRevisions(siteUrl) {
  const apiCall = siteUrl + 'wp-json/epfl/v1/lastrevisions'

  useEffect(() => {
    resetRequest()
    fetchApi(apiCall)
      .then(([status, data]) => {
        setRequestStatus(status)
        if(data) {
          const obj = data[0]
          setPostTitle(obj.post_title)
          setUsername(obj.username)
          setLastChangeDate(obj.last_modified)
        }
      })
      .catch(error => {
        console.log(error)
        setRequestStatus(Case.REQUEST_ERROR)
      })
  }, [apiCall])

  const [postTitle, setPostTitle] = useState('')
  const [lastChangeDate, setLastChangeDate] = useState()
  const [username, setUsername] = useState('')
  const [requestStatus, setRequestStatus] = useState('')
  const resetRequest = () => {
    setRequestStatus('')
    setPostTitle('')
    setLastChangeDate('')
    setUsername('')
  }

  let content = (
    <>
      <li><span>Les dernières pages modifiées sur ce site sont :</span></li>
      <ul>
        <li>
          <span>
            {postTitle} par <a href={`https://search.epfl.ch/?filter=people&q=${username}`}>{username}</a> le {lastChangeDate}
          </span>
        </li>
      </ul>
    </>
  )

  return displayMessage(requestStatus, content)
}

function LastModifications (props) {
  LastModifications.propTypes = {
    siteUrl: PropTypes.string.isRequired,
    pageUrl: PropTypes.string
  }

  return props.pageUrl ? lastChange(props.siteUrl, props.pageUrl) : lastRevisions(props.siteUrl)
}

export default LastModifications
