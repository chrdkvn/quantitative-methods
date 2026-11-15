const teamMembers = [
	{
		name: "Dizon, Samantha Jenica L.",
		role: "Group 2 Member",
		image: "assets/images/Dizon, Samantha Jenica L..jpg"
	},
	{
		name: "Estinopo, Chard Kevin H.",
		role: "Group 2 Member",
		image: "assets/images/Estinopo, Chard Kevin H..jpg",
		skills: [
			{ name: "Java", icon: "J" },
			{ name: "Python", icon: "Py" },
			{ name: "HTML", icon: "</>" },
			{ name: "CSS", icon: "#" }
		]
	},
	{
		name: "Flores, Marksison T.",
		role: "Group 2 Member",
		image: "assets/images/Flores, Marksison T..jpg"
	},
	{
		name: "Galido, Wayne kurt T.",
		role: "Group 2 Member",
		image: "assets/images/Galido, Wayne kurt T..jpg"
	},
	{
		name: "Garofil, Ariene C.",
		role: "Group 2 Member",
		image: "assets/images/Garofil, Ariene C..jpg"
	},
	{ name: "Garsota, Mohandas Nick Vincent R.", role: "Group 2 Member" },
	{
		name: "Gorgonia, Mariel A.",
		role: "Group 2 Member",
		image: "assets/images/Gorgonia, Mariel A..jpg"
	},
	{
		name: "Irinco, Angel Ann",
		role: "Group 2 Member",
		image: "assets/images/Irinco, Angel Ann.jpg"
	},
];

const programmingSkills = [
	{ name: "Java", icon: "J" },
	{ name: "Python", icon: "Py" },
	{ name: "HTML", icon: "</>" },
	{ name: "CSS", icon: "#" }
];

function getInitials(name) {
	return name
		.split(" ")
		.map((part) => part[0])
		.slice(0, 2)
		.join("");
}

function renderTeam() {
	const teamContainer = document.getElementById("teamMembers");
	if (!teamContainer) return;

	teamContainer.innerHTML = teamMembers
		.map(
			(member) => `
				<div class="team-member">
					<div class="avatar ${member.image ? "avatar-image" : ""}">
						${member.image ? `<img src="${member.image}" alt="${member.name}" />` : getInitials(member.name)}
					</div>
					<div>
						<strong>${member.name}</strong>
						<small>${member.role}</small>
						<div class="member-skills" aria-label="Programming skills">
							${(member.skills || programmingSkills).map((skill) => `
								<span class="skill-badge" title="${skill.name}" aria-label="${skill.name}">
									<span class="skill-icon" aria-hidden="true">${skill.icon}</span>
									<span>${skill.name}</span>
								</span>
							`).join("")}
						</div>
					</div>
				</div>
			`,
		)
		.join("");
}