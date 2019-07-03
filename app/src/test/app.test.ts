function requireAll(requireContext: any): any {
	return requireContext.keys().map(requireContext);
}

requireAll((<any>require).context("..", true, /.spec$/));
