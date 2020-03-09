import React from 'react';

export const CustomInput = ({ field, form: { errors }, ...props }) => {
  let cssClassName;
  if (field.name == 'userId') {
    cssClassName = 'd-none';
  } else {
    cssClassName = 'form-group';
  }
  return (
    <div className={cssClassName}>
      <label>{ props.label }</label>
      <input 
        { ...field } 
        { ...props } 
        className={errors[field.name] ? "is-invalid form-control" : "form-control"}
      />
    </div>
  )
}

export const CustomTextarea = ({ field, form: { errors }, ...props}) => {
  return (
    <div className="form-group">
      <label>{ props.label }</label>
      <textarea 
        { ...field} 
        { ...props } 
        id={field.name} 
        className="form-control" 
        rows="5" 
        cols="33" ></textarea>
    </div>
  )
}

export const CustomSelect = ({ field, form, ...props }) => {
  let cssClassName;
  if (field.name == 'role') {
    cssClassName = 'form-group float-left px-2 mb-0';
  } else {
    cssClassName = 'form-group';
  }
  return (
    <div className={cssClassName}>
      { props.label ? (<label>{ props.label }</label>) : null }
      <select 
        { ...field }
        { ...props }
        className="form-control mt-0" />
    </div>
  )
}

export const CustomSingleCheckbox = ({ field, form, ...props }) => {
  return (
    <div className="form-group form-check form-check-inline">
      <input 
        { ...field } 
        { ...props }
        className="form-check-input"
        id={ field.name }
       />
      <label className="form-check-label" htmlFor={ field.name }> { props.label }</label>
    </div>
  )
}

export const CustomCheckbox = ({ field, form, ...props }) => {
  return (
    <div className="form-group form-check form-check-inline">
      <input 
        { ...field } 
        { ...props } 
        checked={form.values.languages && form.values.languages.includes(field.value)} 
        onChange={() => {
          if (form.values.languages.includes(field.value)){
            const nextValue = form.values.languages.filter(
              value => value !== field.value
            );
            form.setFieldValue(field.name, nextValue);
          } else {
            const nextValue = form.values.languages.concat(field.value);
            form.setFieldValue(field.name, nextValue);
          }
        }}
        className={form.errors[field.name] ? "is-invalid form-check-input" : "form-check-input"}
        id={field.value} />
      <label className="form-check-label" htmlFor={field.value}>{ props.label }</label>
    </div>
  )
}
  
export const CustomError = (props) => {
  return (
    <div className="text-danger mb-4">{ props.children }</div> 
  )
}