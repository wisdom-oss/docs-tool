import React from 'react';
import OriginalDropdownNavbarItem from "@theme-original/NavbarItem/DropdownNavbarItem";

const labelIcon = "🪴"; // for now it's a potted plant

function DropdownNavbarItem({...props}): JSX.Element {
  if (props.customType == "branchSelect") {
    let currentBranch = window.location.href.match(/\/repos\/[^\/]+\/([^\/]+)/)[1];
    props.label = labelIcon + "Branch - " + currentBranch;
    props.items = [];
    for (let branch of props.branches) {
      let currentLocation = window.location.href
        .replace(/\/repos\/([^\/]+)\/[^\/]+/, "/repos/$1/" + branch);
      props.items.push({
        to: currentLocation,
        target: "_self",
        label: branch
      });
    }
  }
  return <OriginalDropdownNavbarItem {...props}/>
}

export default DropdownNavbarItem;
