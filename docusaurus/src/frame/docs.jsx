import React, {Component} from "react";
import Layout from "@theme/Layout";

export default class Docs extends Component {
  repo = undefined;
  branch = undefined;
  path = undefined;

  get repoBranchPath() {
    if (this.repo && this.branch && this.path) return {
      repo: this.repo,
      branch: this.branch,
      path: this.path
    }

    let {repo, branch} = this.props.location.pathname
      .match(/^\/(?<repo>[^/]+)\/(?<branch>[^/]+)/).groups;
    let path = (new URLSearchParams(this.props.location.search)).get("path") || "/index.html";

    this.repo = repo;
    this.branch = branch;
    this.path = path;

    return {repo, branch, path}
  }

  interval;

  componentDidMount() {
    document.querySelector(".main-wrapper").style.display = "flex";
    let oldHref = document.querySelector("iframe.static_docs").contentWindow.location.href.replaceAll(/\/+/g, "/");
    this.interval = setInterval(() => {
      let newHref = document.querySelector("iframe.static_docs").contentWindow.location.href.replaceAll(/\/+/g, "/");
      if (oldHref !== newHref) {
        oldHref = newHref;
        this.props.history.push({
          search: "?path=" + encodeURI(newHref.split(/static_docs/)[1])
        });
      }
    }, 200);
  }

  componentWillUnmount() {
    document.querySelector(".main-wrapper").style.display = "unset";
    clearInterval(this.interval);
  }

  render() {
    let {repo, branch, path} = this.repoBranchPath;
    return (
      <>
        <Layout noFooter={true}>
          <iframe
            className="static_docs"
            src={`/repos/${repo}/${branch}/static_docs/${path}`}
            style={{width: "100%", flexGrow: 1}}
          ></iframe>
        </Layout>
      </>
    )
  }
}
