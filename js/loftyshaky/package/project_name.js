export class ProjectName {
    transform = ({ project }) => (
        project.toLowerCase().replace(
            / /g,
            '-',
        )
    )
}
