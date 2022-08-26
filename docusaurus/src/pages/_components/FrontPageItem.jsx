import React from "react";
import Link from "@docusaurus/Link";

export default function FrontPageItem(props) {
  let readme = null;
  if (Object.values(props.branches).some(b => b.hasReadMe)) {
    let defaultReadme = null;
    if (props.branches[props.defaultBranch].hasReadMe) {
      defaultReadme = <li key={"readme." + props.defaultBranch}>
        <Link to={
          `/${props.slug}/${props.defaultBranch.replaceAll("/", "")}/readme/` +
          props.branches[props.defaultBranch].hasReadMe.split(".md")[0]
        } className="dropdown__link">{props.defaultBranch}</Link>
      </li>
    }
    let otherReadmes = [];
    for (
      let [k, b] of Object.entries(props.branches)
        .filter(([k]) => props.defaultBranch !== k)
        .filter(([k, b]) => b.hasReadMe)
    ) {
      otherReadmes.push(<li key={"readme." + k}>
        <Link to={
          `/${props.slug}/${k.replaceAll("/", "")}/readme/` +
          b.hasReadMe.split(".md")[0]
        } className="dropdown__link">{k}</Link>
      </li>);
    }
    readme = <div className="dropdown dropdown--hoverable">
      <button className="button button--primary">README</button>
      <ul className="dropdown__menu">
        {defaultReadme}
        {otherReadmes}
      </ul>
    </div>
  }

  return (
    <div key={props.slug}>
      <div className="card" style={{overflow: "show"}}>
        <div className="card__header">
          <h3>{props.displayName}</h3>
        </div>
        <div className="card__body">
          {readme}
        </div>
      </div>
    </div>
  )
}
