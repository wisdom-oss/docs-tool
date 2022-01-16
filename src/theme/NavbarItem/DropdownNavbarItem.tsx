import React from 'react';
import OriginalDropdownNavbarItem from "@theme-original/NavbarItem/DropdownNavbarItem";

const labelIcon = "🪴"; // for now it's a potted plant

function DropdownNavbarItem({...props}): JSX.Element {
  if (props.customType == "branchSelect") {
    try {
      let [match, currentRepo, currentBranch] = window.location.href
        .match(/\/repos\/([^\/]+)\/([^\/]+)/);
      props.label = labelIcon + "Branch - " + currentBranch;
      props.items = [];
      for (let branch of props.branches[currentRepo]) {
        let currentLocation = window.location.href
          .replace(/\/repos\/([^\/]+)\/[^\/]+/, "/repos/$1/" + branch);
        props.items.push({
          to: currentLocation,
          target: "_self",
          label: branch
        });
      }
    }
    catch (e) {
      console.warn("The branch dropdown cannot find repo or branch in " + window.location.href);
      return null;
    }
    finally {
      delete props.branches;
      delete props.customType;
    }
  }
  return <OriginalDropdownNavbarItem {...props}/>
}

export default DropdownNavbarItem;
