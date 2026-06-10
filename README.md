# Forge JQL Function Example

This project contains a Forge app written in Javascript that defines simple JQL function.

See [developer.atlassian.com/platform/forge/](https://developer.atlassian.com/platform/forge) for documentation and tutorials explaining Forge.

## Requirements

See [Set up Forge](https://developer.atlassian.com/platform/forge/set-up-forge/) for instructions to get set up.

```
? Select an Atlassian app or platform tool: Multiple   
? Select a category: Triggers and Validators    
? Select a template: jira-jql-function    
```

## Quick start

- Modify your app by editing the `src/index.js` file.

- Build and deploy your app by running:
```
forge deploy
```

- Install your app in an Atlassian site by running:
```
forge install
```

- If an updated version of your app is available, run `forge deploy` to update your app and then run `forge install --upgrade` again to update the app on your site.

- Develop your app by running `forge tunnel` to proxy invocations locally:
```
forge tunnel
```

### Notes
- Use the `forge deploy` command when you want to persist code changes.
- Use the `forge install` command when you want to install the app on a new site.
- Once the app is installed on a site, the site picks up the new app changes you deploy without needing to rerun the install command.

## Support

See [Get help](https://developer.atlassian.com/platform/forge/get-help/) for how to get help and provide feedback.
