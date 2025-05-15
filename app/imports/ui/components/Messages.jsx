import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle, AlertTriangle, AlertCircle, Loader } from "lucide-react";

const AlertMessage = ({ type, message, icon }) => {
  const alertClasses = {
    success: "alert alert-success",
    danger: "alert alert-danger",
    warning: "alert alert-warning",
    info: "alert alert-info",
  };

  return (
    <div className="py-4">
      <div className={alertClasses[type]} role="alert">
        <div className="d-flex align-items-center">
          {icon}
          <span className="ml-2">{message}</span>
        </div>
      </div>
    </div>
  );
};

export const AlertSuccess = ({ message }) => (
  <AlertMessage 
    type="success" 
    message={message} 
    icon={<CheckCircle size={20} color="green" />} 
  />
);

export const AlertDanger = ({ message }) => (
  <AlertMessage 
    type="danger" 
    message={message} 
    icon={<AlertCircle size={20} color="red" />} 
  />
);

export const AlertWarning = ({ message }) => (
  <AlertMessage 
    type="warning" 
    message={message} 
    icon={<AlertTriangle size={20} color="orange" />} 
  />
);

export const AlertInfo = ({ message }) => (
  <AlertMessage 
    type="info" 
    message={message} 
    icon={<Loader size={20} color="blue" />} 
  />
);

export const AlertSiteSuccess = ({ id, title }) => (
  <AlertSuccess message={
    <span>
      Le site <strong>{title}</strong> a été créé avec succès !{" "}
      <a href={"/edit/" + id}>Éditer à nouveau ce site</a>
    </span>
  } />
);

export const Loading = () => (
  <h1>Loading...</h1>
);

export const DangerMessage = (props) => (
  <div
    id={props.elementId}
    className="alert alert-danger alert-dismissible fade show mt-4"
    role="alert"
  >
    <strong>{props.title}</strong> {props.message}
    {props.additional && (
      <div className="list-error-message mt-4">
        <ul>
          {props.additional.map((site) => (
            <li>
              <Link to={`/edit/${site._id}`}>{site.url}</Link>
            </li>
          ))}
        </ul>
      </div>
    )}
    <button
      type="button"
      className="close"
      data-dismiss="alert"
      aria-label="Close"
    >
      <span aria-hidden="true">&times;</span>
    </button>
  </div>
);
