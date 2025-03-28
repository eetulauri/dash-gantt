
module DashGantt
using Dash

const resources_path = realpath(joinpath( @__DIR__, "..", "deps"))
const version = "0.0.1"

include("jl/''_dashgantt.jl")

function __init__()
    DashBase.register_package(
        DashBase.ResourcePkg(
            "dash_gantt",
            resources_path,
            version = version,
            [
                DashBase.Resource(
    relative_package_path = "async-DashGantt.js",
    external_url = "https://unpkg.com/dash_gantt@0.0.1/dash_gantt/async-DashGantt.js",
    dynamic = nothing,
    async = :true,
    type = :js
),
DashBase.Resource(
    relative_package_path = "async-DashGantt.js.map",
    external_url = "https://unpkg.com/dash_gantt@0.0.1/dash_gantt/async-DashGantt.js.map",
    dynamic = true,
    async = nothing,
    type = :js
),
DashBase.Resource(
    relative_package_path = "dash_gantt.min.js",
    external_url = nothing,
    dynamic = nothing,
    async = nothing,
    type = :js
),
DashBase.Resource(
    relative_package_path = "dash_gantt.min.js.map",
    external_url = nothing,
    dynamic = true,
    async = nothing,
    type = :js
)
            ]
        )

    )
end
end
