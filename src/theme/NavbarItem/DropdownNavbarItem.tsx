import React from 'react';
import OriginalDropdownNavbarItem from "@theme-original/NavbarItem/DropdownNavbarItem";
import {useLocation} from "react-router-dom";

/** Icon in the left of the label */
const labelIcon = "🪴"; // for now it's a potted plant

/**
 * Overloaded DropdownNavbarItem to allow for another feature without the use
 * of a custom plugin.
 *
 * This allows to get a dropdown menu for branch selection.
 * @param props Props for react
 * @constructor
 */
function DropdownNavbarItem({...props}): JSX.Element {
  if (props.customType == "branchSelect") {
    // now we now that we want a branch selector
    try {
      // extract the current repo and branch from the location
      let [match, currentRepo, currentBranch] = useLocation().pathname
        .match(/\/repos\/([^\/]+)\/([^\/]+)/);

      props.label = labelIcon + "Branch - " + currentBranch;
      props.items = [];
      for (let branch of props.branches[currentRepo]) {
        // iterate over every branch of the current repo

        // use the current location with a selected branch
        let currentLocation = useLocation().pathname
          .replace(/\/repos\/([^\/]+)\/[^\/]+/, "/repos/$1/" + branch);

        props.items.push({
          to: currentLocation,
          target: "_self",
          label: branch
        });
      }
    }
    catch (e) {
      // on some pages the dropdown cannot find the current branch
      // but this is not a big issue, will simply be not displayed
      console.warn(
        "The branch dropdown cannot find repo or branch in " +
        useLocation().pathname
      );
      return null;
    }
    finally {
      // remove the data from the html tag, since it's not necessary to show
      // there
      delete props.branches;
      delete props.customType;
    }
  }

  return <OriginalDropdownNavbarItem {...props}/>
}

export default DropdownNavbarItem;
