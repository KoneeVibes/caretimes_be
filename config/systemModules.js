const systemModules = [
	{
		name: "Dashboard",
		userType: ["super-admin", "admin", "distributor"],
	},
	{
		name: "Orders",
		userType: ["super-admin", "admin", "distributor"],
	},
	{
		name: "Inventory",
		userType: ["super-admin", "admin", "distributor"],
	},
	{
		name: "Transactions",
		userType: ["super-admin", "admin", "distributor"],
	},
	// {
	// 	name: "Support",
	// 	userType: ["super-admin", "admin", "distributor"],
	// },
	{
		name: "Admin Management",
		userType: ["super-admin"],
	},
	// {
	// 	name: "Settings",
	// 	userType: ["super-admin", "admin", "distributor"],
	// },
	{
		name: "Logout",
		userType: ["super-admin", "admin", "distributor"],
	},
];

module.exports = systemModules;
