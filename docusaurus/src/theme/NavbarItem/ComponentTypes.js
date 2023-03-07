import ComponentTypes from '@theme-original/NavbarItem/ComponentTypes';
import OtherDocsOnBranchNavbarItem from "@site/src/components/NavbarItems/OtherDocsOnBranchNavbarItem";
import BranchSelectNavbarItem from "@site/src/components/NavbarItems/BranchSelectNavbarItem";
import OtherGlobalDocsNavbarItem from "@site/src/components/NavbarItems/OtherGlobalDocsNavbarItem";

export default {
  ...ComponentTypes,
  'custom-other-docs-on-branch': OtherDocsOnBranchNavbarItem,
  "custom-branch-select": BranchSelectNavbarItem,
  "custom-other-global-docs": OtherGlobalDocsNavbarItem
};
