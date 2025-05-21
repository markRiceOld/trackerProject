export const GET_PROJECTS = `
  query GetProjects {
    projects {
      id
      title
      dod
      type
      actions {
        id
        title
        done
        tbd
      }
      goal {
        id
        title
      }
    }
  }
`

export const GET_PROJECT = `
query GetProject($id: ID!) {
  project(id: $id) {
    id
    title
    dod
    actions {
      id
      title
      done
      tbd
    }
    goal {
      id
      title
    }
  }
}
`

export const UPDATE_PROJECT = `
mutation UpdateProject($id: ID!, $title: String, $dod: String) {
  updateProject(id: $id, title: $title, dod: $dod) {
    id
  }
}
`

export const ADD_PROJECT = `
mutation AddProject($title: String!, $dod: String, $actions: [ActionInput!]) {
  addProject(title: $title, dod: $dod, actions: $actions) {
    id
  }
}
`

export const ADD_GOAL_PROJECT = `
mutation AddGoalProject($title: String!, $dod: String, $actions: [ActionInput!], $goalId: ID!) {
  addProject(title: $title, dod: $dod, actions: $actions, goalId: $goalId) {
    id
  }
}
`;


export const ADD_PROJECT_ACTION = `
mutation AddAction($title: String!, $tbd: String, $projectId: String) {
  addAction(title: $title, tbd: $tbd, projectId: $projectId) {
    id
  }
}
`
export const DELETE_ACTION = `
mutation DeleteAction($id: ID!) {
  deleteAction(id: $id) {
    id
  }
}
`

export const UPDATE_ACTION = `
mutation UpdateAction($id: ID!, $title: String, $tbd: String, $done: Boolean) {
  updateAction(id: $id, title: $title, tbd: $tbd, done: $done) {
    id
    title
    tbd
    done
  }
}
`

export const ADD_ACTION = `
mutation AddAction($title: String!, $tbd: String) {
  addAction(title: $title, tbd: $tbd) {
    id
    title
    tbd
    done
  }
}
`

export const TOGGLE_ACTION = `
mutation ToggleAction($id: ID!) {
  toggleAction(id: $id) {
    id
    done
  }
}
`

export const GET_ACTIONS = `
  query GetActions {
    actions {
      id
      title
      tbd
      done
    }
  }
`;

export const LOGIN_MUTATION = `
mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    token
    user {
      id
      email
    }
  }
}
`;

export const REGISTER_MUTATION = `
  mutation Register($email: String!, $password: String!) {
    register(email: $email, password: $password) {
      token
      user {
        id
        email
      }
    }
  }
`;

export const ADD_GOAL = `
  mutation AddGoal($title: String!, $dod: String) {
    addGoal(title: $title, dod: $dod) {
      id
    }
  }
`;

export const DELETE_GOAL = `
mutation DeleteGoal($id: ID!) {
  deleteGoal(id: $id) {
    id
  }
}
`

export const GET_GOALS = `
  query GetGoals {
    goals {
      id
      title
      dod
      startDate
      endDate
      projects {
        id
        title
        startDate
        endDate
      }
    }
  }
`

export const GET_GOAL = `
query GetGoal($id: ID!) {
  goal(id: $id) {
    id
    title
    dod
    startDate
    endDate
    projects {
      id
      title
      startDate
      endDate
      actions { done }
    }
  }
}
`

export const UPDATE_GOAL = `
mutation UpdateGoal($id: ID!, $[1]: String) {
  updateGoal(id: $id, [1]: $[1]) {
    id
  }
}
`

export const DELETE_PROJECT = `
mutation DeleteProject($id: ID!) {
  deleteProject(id: $id) { id }
}
`

export const GET_STANDALONE_ACTIONS = `
query GetStandaloneActions($date: String!) {
  standaloneActions(date: $date) {
    id
    title
    tbd
    done
  }
}
`

export const GET_LINKED_ACTIONS = `
query GetLinkedActions($date: String!) {
  linkedActions(date: $date) {
    id
    title
    tbd
    done
    project {
      id
      title
    }
  }
}
`
