import React from "react";
import Link from "@docusaurus/Link";
import IconExternalLink from '@theme/Icon/ExternalLink';

function createDropdown(
  props,
  hasProperty,
  keyName,
  displayName,
  pathFragment,
  defaultEntry,
  branchEntry,
  buttonColor
) {
  if (!Object.values(props.branches).some(b => b[hasProperty])) return null;
  let defaultElement = null;
  if (props.branches[props.defaultBranch][hasProperty]) {
    defaultElement = <li key={`${keyName}.${props.defaultBranch}`}>
      <Link to={[
        "",
        props.slug,
        props.defaultBranch.replaceAll("/", ""),
        pathFragment,
        defaultEntry(props)
      ].join("/")} className="dropdown__link">
        <b><i>{props.defaultBranch}</i></b>
      </Link>
    </li>
  }
  let otherElements = [];
  for (
    let [k, b] of Object.entries(props.branches)
    .filter(([k]) => props.defaultBranch !== k)
    .filter(([k, b]) => b[hasProperty])
    .sort(([ka], [kb]) => ka.localeCompare(kb))
    ) {
    otherElements.push(
      <li key={`${keyName}.${k}`}>
        <Link to={[
          "",
          props.slug,
          k.replaceAll("/", ""),
          pathFragment,
          branchEntry(props, k, b),
        ].join("/")} className="dropdown__link">{k}</Link>
      </li>
    );
  }
  return (
    <div className="dropdown dropdown--hoverable">
      <button className="button" style={{backgroundColor: buttonColor}}>
        {displayName}
      </button>
      <ul className="dropdown__menu">
        {defaultElement}
        {defaultElement && !!otherElements.length && <hr className="margin--sm"/>}
        {otherElements}
      </ul>
    </div>
  );
}

export default function FrontPageItem(props) {
  let readme = createDropdown(
    props,
    "hasReadMe",
    "readme",
    "README",
    "readme",
    props => props.branches[props.defaultBranch].hasReadMe.split(".md")[0],
    (props, k, b) => b.hasReadMe.split(".md")[0],
    "#f3ad26"
  );
  let docs = createDropdown(
    props,
    "hasDocs",
    "docs",
    "Docs",
    "docs",
    props => props.branches[props.defaultBranch].hasDocs.split(".md")[0],
    (props, k, b) => b.hasDocs.split(".md")[0],
    "#2c7ff4"
  );
  let staticDocs = createDropdown(
    props,
    "hasStaticDocs",
    "static_docs",
    "Docs",
    "docs",
    props => "",
    props => "",
    "#2c7ff4"
  );
  let api = createDropdown(
    props,
    "hasApi",
    "api",
    "API",
    "api",
    props => "",
    props => "",
    "#43d539"
  )

  return (
    <div key={props.slug}>
      <div className="card" style={{overflow: "visible"}}>
        <div className="card__header" style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline"
        }}>
          <h3>
            <Link
              href={"https://github.com/wisdom-oss/" + props.slug}
              className="navbar__link"
            >
              {props.displayName}
              <IconExternalLink></IconExternalLink>
            </Link>
          </h3>
          {
            props.private &&
            <span
              className="badge"
              style={{border: "rgba(0, 0, 0, 0.6) 1px solid"}}
            >private</span>
          }
        </div>
        <div className="card__body">
          {props.description && <p>{props.description}</p>}
          {readme && <span className="margin-right--sm">
            {readme}
          </span>}
          {docs && <span className="margin-right--sm">
            {docs}
          </span>}
          {staticDocs && <span className="margin-right--sm">
            {staticDocs}
          </span>}
          {api && <span className="margin-right--sm">
            {api}
          </span>}
        </div>
      </div>
    </div>
  )
}
