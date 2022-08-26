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

  componentDidMount() {
    const updateFrame = iframe => {
      let linkElement = iframe.contentDocument.createElement("link");
      linkElement.setAttribute("rel", "stylesheet");
      linkElement.setAttribute("href", "/styles/compodoc.css");
      iframe.contentDocument.head.append(linkElement);

      console.log("updating height");
      iframe.style.height = "400px";
      let height = 0;
      for (let el of document.body.querySelectorAll("div")) {
        if (height < el.scrollHeight) height = el.scrollHeight;
      }
      iframe.style.height = height + "px";

      let {repo, branch} = this.repoBranchPath;
      for (let a of iframe.contentDocument.body.querySelectorAll("a")) {
        a.addEventListener("click", event => {
          event.preventDefault();
          let path = a.href.split("/static_docs/")[1];
          this.props.history.push({
            pathname: `/${repo}/${branch}/docs`,
            search: "?path=" + encodeURI(path)
          });
          this.props.history.go();
        });
      }
    }

    let iframe = document.querySelector("iframe.static_docs");
    if (iframe) updateFrame(iframe);
    else window.onload = () => {
      let iframe = document.querySelector("iframe.static_docs");
      if (iframe) updateFrame(iframe);
    }
  }

  render() {
    let {repo, branch, path} = this.repoBranchPath;
    return (
      <Layout>
        <iframe
          className="static_docs"
          src={`/repos/${repo}/${branch}/static_docs/${path}`}
          style={{width: "100%", minHeight: "400px"}}
        ></iframe>
      </Layout>
    )
  }
}
