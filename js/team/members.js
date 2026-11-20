const teamMembers = [
	{
		name: "Dizon, Samantha Jenica L.",
		role: "Group 2 Member",
		image: "assets/images/Dizon, Samantha Jenica L..webp"
	},
	{
		name: "Estinopo, Chard Kevin H.",
		role: "Group 2 Member",
		image: "assets/images/Estinopo, Chard Kevin H..webp",
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
		image: "assets/images/Flores, Marksison T..webp"
	},
	{
		name: "Galido, Wayne kurt T.",
		role: "Group 2 Member",
		image: "assets/images/Galido, Wayne kurt T..webp"
	},
	{
		name: "Garofil, Ariene C.",
		role: "Group 2 Member",
		image: "assets/images/Garofil, Ariene C..webp"
	},
	{ name: "Garsota, Mohandas Nick Vincent R.", role: "Group 2 Member" },
	{
		name: "Gorgonia, Mariel A.",
		role: "Group 2 Member",
		image: "assets/images/Gorgonia, Mariel A..webp"
	},
	{
		name: "Irinco, Angel Ann",
		role: "Group 2 Member",
		image: "assets/images/Irinco, Angel Ann.webp"
	},
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

	teamContainer.innerHTML = teamMembers.map((member) => `
		<article class="team-member profile-card">
			<div class="avatar ${member.image ? "avatar-image" : "avatar-placeholder"}">
				${member.image
					? `<img src="${member.image}" alt="Portrait of ${member.name}" loading="lazy" decoding="async">`
					: `<span aria-hidden="true">${getInitials(member.name)}</span>`}
			</div>
			<div class="profile-copy">
				<strong>${member.name}</strong>
				<small>${member.role}</small>
			</div>
		</article>
	`).join("");
}

document.addEventListener("DOMContentLoaded", renderTeam);
